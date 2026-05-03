import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import { connectDB } from '../lib/mongodb';
import { User } from '../lib/models/User';
import { Attendance } from '../lib/models/Attendance';
import { Leave } from '../lib/models/Leave';
import { Payroll } from '../lib/models/Payroll';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({ path: '.env.local' });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: '.env' });
}

// Set default MongoDB URI if not found
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/empay';
  console.log('⚠️  Using default MongoDB URI: mongodb://localhost:27017/empay');
}

// Configuration
const BATCH_SIZE = 100;
const TOTAL_RECORDS = 1000;
const MONTHS_TO_GENERATE = 12; // Generate data for last 12 months

// Helper functions
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateEmployeeId(): string {
  return `EMP${String(randomBetween(1000, 9999)).padStart(4, '0')}`;
}

function generateCheckInTime(): Date {
  const now = new Date();
  const checkInHour = randomBetween(7, 10); // Check in between 7 AM and 10 AM
  const checkInMinute = randomBetween(0, 59);
  now.setHours(checkInHour, checkInMinute, 0, 0);
  return now;
}

interface CheckOutResult {
  checkOut: Date;
  breaks: Array<{ start: Date; end: Date }>;
}

function generateCheckOutTime(checkIn: Date): CheckOutResult {
  const checkOut = new Date(checkIn);
  const workHours = randomBetween(6, 10); // Work between 6-10 hours
  checkOut.setHours(checkOut.getHours() + workHours);
  
  // Add random breaks
  if (Math.random() > 0.3) { // 70% chance of taking a break
    const breakStart = new Date(checkIn);
    breakStart.setHours(checkIn.getHours() + randomBetween(3, 5));
    const breakEnd = new Date(breakStart);
    breakEnd.setMinutes(breakEnd.getMinutes() + randomBetween(30, 90));
    
    return {
      checkOut,
      breaks: [{ start: breakStart, end: breakEnd }]
    };
  }
  
  return { checkOut, breaks: [] };
}

// Main seeding functions
async function seedUsers(): Promise<any[]> {
  console.log('👥 Seeding users...');
  
  const departments = ['Engineering', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations'];
  const positions = ['Software Engineer', 'HR Manager', 'Accountant', 'Marketing Manager', 'Sales Executive', 'Operations Manager'];
  const roles = ['Employee', 'Employee', 'Employee', 'Employee', 'HR_Officer', 'Payroll_Officer', 'Admin'];
  
  const users = [];
  
  for (let i = 0; i < 50; i++) { // Create 50 users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const user = {
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      employeeId: generateEmployeeId(),
      password: hashedPassword,
      role: randomChoice(roles),
      jobPosition: randomChoice(positions),
      department: randomChoice(departments),
      mobileNumber: faker.phone.number(),
      company: 'EmPay Corporation',
      manager: faker.person.fullName(),
      location: randomChoice(['New York', 'San Francisco', 'London', 'Tokyo', 'Mumbai']),
      dateOfBirth: faker.date.birthdate({ min: 22, max: 60 }),
      residingAddress: faker.location.streetAddress(),
      nationality: randomChoice(['US', 'UK', 'IN', 'JP', 'CA']),
      personalEmail: faker.internet.email(),
      gender: randomChoice(['Male', 'Female', 'Other']),
      maritalStatus: randomChoice(['Single', 'Married', 'Divorced']),
      joiningDate: generateRandomDate(subMonths(new Date(), 24), subDays(new Date(), 30)),
      wageType: 'Fixed',
      basicSalary: randomBetween(40000, 150000),
      salaryComponents: [
        {
          name: 'HRA',
          computationType: 'Percentage',
          value: 40,
          calculatedValue: 0,
          basisComponent: 'Basic'
        },
        {
          name: 'Special Allowance',
          computationType: 'Fixed',
          value: randomBetween(5000, 15000),
          calculatedValue: 0,
          basisComponent: ''
        }
      ],
      salaryConfig: {
        pfRate: 12,
        professionalTax: 200
      },
      bankDetails: {
        bankName: randomChoice(['HDFC Bank', 'ICICI Bank', 'SBI Bank', 'Axis Bank']),
        accountNumber: faker.finance.accountNumber(),
        ifscCode: faker.finance.bic(),
        branchName: faker.location.streetAddress(),
        panNo: faker.string.alphanumeric(10).toUpperCase(),
        uanNo: faker.string.numeric(12)
      },
      adminPermissions: {
        canApproveLeaves: false,
        canApprovePay: false,
        canManageUsers: false,
        canViewReports: false
      },
      profileImage: '',
      documents: []
    };
    
    users.push(user);
  }
  
  // Insert users in batches
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    await User.insertMany(batch, { ordered: false });
    console.log(`✅ Inserted users batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(users.length / BATCH_SIZE)}`);
  }
  
  const insertedUsers = await User.find({});
  console.log(`👥 Created ${insertedUsers.length} users`);
  return insertedUsers;
}

async function seedAttendance(users: any[]): Promise<void> {
  console.log('📅 Seeding attendance records...');
  
  const attendanceRecords = [];
  const today = new Date();
  const startDate = subMonths(today, MONTHS_TO_GENERATE);
  
  for (const user of users) {
    // Generate attendance for each user for the last 12 months
    for (let monthOffset = 0; monthOffset < MONTHS_TO_GENERATE; monthOffset++) {
      const monthStart = startOfMonth(subMonths(today, monthOffset));
      const monthEnd = endOfMonth(monthStart);
      const workDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
        .filter(date => date.getDay() !== 0 && date.getDay() !== 6); // Exclude weekends
      
      for (const workDay of workDays) {
        // 85% attendance rate (some sick days, leaves, etc.)
        if (Math.random() > 0.15) {
          const dateStr = format(workDay, 'yyyy-MM-dd');
          const checkIn = generateCheckInTime();
          const { checkOut, breaks } = generateCheckOutTime(checkIn);
          
          // Calculate working hours
          let totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
          
          // Subtract break time
          breaks.forEach((breakTime: any) => {
            const breakDuration = (breakTime.end.getTime() - breakTime.start.getTime()) / (1000 * 60 * 60);
            totalHours -= breakDuration;
          });
          
          const attendance = {
            user: user._id,
            date: dateStr,
            status: randomChoice(['Present', 'Present', 'Present', 'Half_Day']), // More Present than Half_Day
            checkIn,
            checkOut,
            breaks,
            totalWorkingHours: Math.max(0, Math.min(24, totalHours)),
            notes: Math.random() > 0.8 ? faker.lorem.sentence() : '',
            timerStartTime: checkIn,
            lastBreakStart: breaks.length > 0 ? breaks[breaks.length - 1].start : null,
            employeeId: user.employeeId
          };
          
          attendanceRecords.push(attendance);
        }
      }
    }
  }
  
  // Insert attendance in batches
  for (let i = 0; i < attendanceRecords.length; i += BATCH_SIZE) {
    const batch = attendanceRecords.slice(i, i + BATCH_SIZE);
    try {
      await Attendance.insertMany(batch, { ordered: false });
      console.log(`✅ Inserted attendance batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(attendanceRecords.length / BATCH_SIZE)}`);
    } catch (error: any) {
      if (error.code === 11000) {
        console.log(`⚠️  Skipping duplicate attendance records in batch ${Math.floor(i / BATCH_SIZE) + 1}`);
      } else {
        console.error(`❌ Error inserting attendance batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
      }
    }
  }
  
  const totalAttendance = await Attendance.countDocuments();
  console.log(`📅 Created ${totalAttendance} attendance records`);
}

async function seedLeaves(users: any[]): Promise<void> {
  console.log('🏖️ Seeding leave records...');
  
  const leaveRecords = [];
  const leaveTypes = ['Sick', 'Casual', 'Earned', 'Unpaid'];
  const today = new Date();
  const leaveStartDate = subMonths(today, MONTHS_TO_GENERATE);
  
  for (const user of users) {
    // Generate 2-5 leave requests per user for the last 12 months
    const numLeaves = randomBetween(2, 5);
    
    for (let i = 0; i < numLeaves; i++) {
      const startDate = generateRandomDate(leaveStartDate, today);
      const duration = randomBetween(1, 5); // 1-5 days
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + duration);
      
      const leave = {
        user: user._id,
        type: randomChoice(leaveTypes),
        startDate,
        endDate,
        status: randomChoice(['Approved', 'Approved', 'Pending', 'Rejected']), // More Approved
        reason: faker.lorem.sentences(2),
        approvedBy: Math.random() > 0.5 ? users[randomBetween(0, users.length - 1)]._id : null
      };
      
      leaveRecords.push(leave);
    }
  }
  
  // Insert leaves in batches
  for (let i = 0; i < leaveRecords.length; i += BATCH_SIZE) {
    const batch = leaveRecords.slice(i, i + BATCH_SIZE);
    try {
      await Leave.insertMany(batch, { ordered: false });
      console.log(`✅ Inserted leave batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(leaveRecords.length / BATCH_SIZE)}`);
    } catch (error: any) {
      if (error.code === 11000) {
        console.log(`⚠️  Skipping duplicate leave records in batch ${Math.floor(i / BATCH_SIZE) + 1}`);
      } else {
        console.error(`❌ Error inserting leave batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
      }
    }
  }
  
  const totalLeaves = await Leave.countDocuments();
  console.log(`🏖️ Created ${totalLeaves} leave records`);
}

async function seedPayroll(users: any[]): Promise<void> {
  console.log('💰 Seeding payroll records...');
  
  const payrollRecords = [];
  const today = new Date();
  
  for (const user of users) {
    // Generate payroll for each user for the last 12 months
    for (let monthOffset = 0; monthOffset < MONTHS_TO_GENERATE; monthOffset++) {
      const monthDate = subMonths(today, monthOffset);
      const monthStr = format(monthDate, 'yyyy-MM');
      
      // Calculate payroll components
      const basicSalary = user.basicSalary;
      const hra = basicSalary * 0.4; // 40% HRA
      const specialAllowance = user.salaryComponents[1].value;
      const totalEarnings = basicSalary + hra + specialAllowance;
      
      // Calculate deductions
      const pfDeduction = basicSalary * (user.salaryConfig.pfRate / 100);
      const professionalTax = user.salaryConfig.professionalTax;
      const totalDeductions = pfDeduction + professionalTax;
      
      // Get attendance data for the month
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const workDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
        .filter(date => date.getDay() !== 0 && date.getDay() !== 6).length;
      
      const attendanceRecords = await Attendance.find({
        user: user._id,
        date: { $gte: format(monthStart, 'yyyy-MM-dd'), $lte: format(monthEnd, 'yyyy-MM-dd') }
      });
      
      const presentDays = attendanceRecords.filter(record => record.status === 'Present').length;
      const halfDays = attendanceRecords.filter(record => record.status === 'Half_Day').length;
      const payableDays = presentDays + (halfDays * 0.5);
      const unpaidLeaves = workDays - payableDays;
      
      // Calculate overtime (some random overtime for demonstration)
      const overtimeHours = randomBetween(0, 20);
      const overtimePay = overtimeHours * (basicSalary / 160) * 1.5; // 1.5x rate for overtime
      
      // Adjust earnings based on payable days
      const adjustedEarnings = (totalEarnings / workDays) * payableDays + overtimePay;
      const netSalary = adjustedEarnings - totalDeductions;
      
      const payroll = {
        user: user._id,
        month: monthStr,
        basicSalary,
        payableDays: Math.round(payableDays * 10) / 10, // Round to 1 decimal
        unpaidLeaves: Math.round(unpaidLeaves * 10) / 10,
        totalWorkingHours: attendanceRecords.reduce((sum, record) => sum + (record.totalWorkingHours || 0), 0),
        overtimeHours,
        overtimePay,
        pfDeduction,
        professionalTax,
        totalEarnings: Math.round(adjustedEarnings),
        totalDeductions: Math.round(totalDeductions),
        netSalary: Math.round(netSalary),
        status: randomChoice(['Processed', 'Processed', 'Paid', 'Pending']) // Most are Processed
      };
      
      payrollRecords.push(payroll);
    }
  }
  
  // Insert payroll in batches
  for (let i = 0; i < payrollRecords.length; i += BATCH_SIZE) {
    const batch = payrollRecords.slice(i, i + BATCH_SIZE);
    try {
      await Payroll.insertMany(batch, { ordered: false });
      console.log(`✅ Inserted payroll batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(payrollRecords.length / BATCH_SIZE)}`);
    } catch (error: any) {
      if (error.code === 11000) {
        console.log(`⚠️  Skipping duplicate payroll records in batch ${Math.floor(i / BATCH_SIZE) + 1}`);
      } else {
        console.error(`❌ Error inserting payroll batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
      }
    }
  }
  
  const totalPayroll = await Payroll.countDocuments();
  console.log(`💰 Created ${totalPayroll} payroll records`);
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting bulk data seeding...');
    console.log(`📊 Target: ${TOTAL_RECORDS} records per collection for ${MONTHS_TO_GENERATE} months`);
    
    await connectDB();
    
    // Check if data already exists
    const userCount = await User.countDocuments();
    const attendanceCount = await Attendance.countDocuments();
    const leaveCount = await Leave.countDocuments();
    const payrollCount = await Payroll.countDocuments();
    
    console.log(`📈 Current database state:`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Attendance: ${attendanceCount}`);
    console.log(`   Leaves: ${leaveCount}`);
    console.log(`   Payroll: ${payrollCount}`);
    
    // Seed users first (if needed)
    let users = await User.find({});
    if (users.length === 0) {
      users = await seedUsers();
    } else {
      console.log(`👥 Using existing ${users.length} users`);
    }
    
    // Seed other collections
    await seedAttendance(users);
    await seedLeaves(users);
    await seedPayroll(users);
    
    // Final counts
    const finalUserCount = await User.countDocuments();
    const finalAttendanceCount = await Attendance.countDocuments();
    const finalLeaveCount = await Leave.countDocuments();
    const finalPayrollCount = await Payroll.countDocuments();
    
    console.log('\n🎉 Seeding completed!');
    console.log(`📊 Final database state:`);
    console.log(`   Users: ${finalUserCount}`);
    console.log(`   Attendance: ${finalAttendanceCount}`);
    console.log(`   Leaves: ${finalLeaveCount}`);
    console.log(`   Payroll: ${finalPayrollCount}`);
    
    if (finalAttendanceCount >= TOTAL_RECORDS && finalLeaveCount >= TOTAL_RECORDS && finalPayrollCount >= TOTAL_RECORDS) {
      console.log(`✅ Successfully created at least ${TOTAL_RECORDS} records in each collection!`);
    } else {
      console.log(`⚠️  Some collections have fewer than ${TOTAL_RECORDS} records`);
    }
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
main();
