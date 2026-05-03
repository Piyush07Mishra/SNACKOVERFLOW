import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

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
const MONTHS_TO_GENERATE = 12;

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
  const checkInHour = randomBetween(7, 10);
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
  const workHours = randomBetween(6, 10);
  checkOut.setHours(checkOut.getHours() + workHours);
  
  if (Math.random() > 0.3) {
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

// Schema definitions (inline to avoid import issues)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 100 },
  employeeId: { type: String, unique: true, trim: true, uppercase: true, maxlength: 20 },
  password: { type: String, required: true, minlength: 8, maxlength: 128, select: false },
  role: { type: String, enum: ['Admin', 'Employee', 'HR_Officer', 'Payroll_Officer'], default: 'Employee' },
  jobPosition: { type: String, default: '' },
  mobileNumber: { type: String, default: '' },
  company: { type: String, default: '' },
  department: { type: String, default: '' },
  manager: { type: String, default: '' },
  location: { type: String, default: '' },
  dateOfBirth: { type: Date, default: null },
  residingAddress: { type: String, default: '' },
  nationality: { type: String, default: '' },
  personalEmail: { type: String, default: '' },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  maritalStatus: { type: String, default: '' },
  joiningDate: { type: Date, default: Date.now },
  wageType: { type: String, enum: ['Fixed', 'Variable'], default: 'Fixed' },
  basicSalary: { type: Number, default: 0 },
  salaryComponents: [{
    name: { type: String, required: true },
    computationType: { type: String, enum: ['Fixed', 'Percentage'], default: 'Fixed' },
    value: { type: Number, default: 0 },
    calculatedValue: { type: Number, default: 0 },
    basisComponent: { type: String, default: '' }
  }],
  salaryConfig: {
    pfRate: { type: Number, default: 12 },
    professionalTax: { type: Number, default: 200 }
  },
  bankDetails: {
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    branchName: { type: String, default: '' },
    panNo: { type: String, default: '' },
    uanNo: { type: String, default: '' }
  },
  adminPermissions: {
    canApproveLeaves: { type: Boolean, default: false },
    canApprovePay: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false }
  },
  profileImage: { type: String, default: '' },
  documents: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    filePath: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const AttendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true, match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'] },
  status: { type: String, enum: ['Present', 'Absent', 'Half_Day', 'Leave'], default: 'Present', required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  breaks: [{
    start: { type: Date, required: true },
    end: { type: Date }
  }],
  totalWorkingHours: { type: Number, default: 0, min: 0, max: 24 },
  notes: { type: String, default: '', maxlength: 500, trim: true },
  timerStartTime: { type: Date },
  lastBreakStart: { type: Date },
  employeeId: { type: String, uppercase: true, trim: true, maxlength: 20 }
}, { timestamps: true });

const LeaveSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['Sick', 'Casual', 'Earned', 'Unpaid'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  reason: { type: String, required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const PayrollSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true },
  basicSalary: { type: Number, required: true },
  payableDays: { type: Number, required: true },
  unpaidLeaves: { type: Number, default: 0 },
  totalWorkingHours: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  overtimePay: { type: Number, default: 0 },
  pfDeduction: { type: Number, required: true },
  professionalTax: { type: Number, required: true },
  totalEarnings: { type: Number, required: true },
  totalDeductions: { type: Number, required: true },
  netSalary: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Processed', 'Paid'], default: 'Pending' }
}, { timestamps: true });

// Add indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ employeeId: 1 }, { unique: true });
AttendanceSchema.index({ user: 1, date: 1 }, { unique: true });
LeaveSchema.index({ user: 1, startDate: 1 });
PayrollSchema.index({ user: 1, month: 1 }, { unique: true });

// Models
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
const Leave = mongoose.models.Leave || mongoose.model('Leave', LeaveSchema);
const Payroll = mongoose.models.Payroll || mongoose.model('Payroll', PayrollSchema);

// Seeding functions
async function seedUsers(): Promise<any[]> {
  console.log('👥 Seeding users...');
  
  const departments = ['Engineering', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations'];
  const positions = ['Software Engineer', 'HR Manager', 'Accountant', 'Marketing Manager', 'Sales Executive', 'Operations Manager'];
  const roles = ['Employee', 'Employee', 'Employee', 'Employee', 'HR_Officer', 'Payroll_Officer', 'Admin'];
  
  const users = [];
  
  for (let i = 0; i < 50; i++) {
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
      dateOfBirth: faker.date.past({ years: randomBetween(22, 60), refDate: new Date() }),
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
    for (let monthOffset = 0; monthOffset < MONTHS_TO_GENERATE; monthOffset++) {
      const monthStart = startOfMonth(subMonths(today, monthOffset));
      const monthEnd = endOfMonth(monthStart);
      const workDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
        .filter(date => date.getDay() !== 0 && date.getDay() !== 6);
      
      for (const workDay of workDays) {
        if (Math.random() > 0.15) {
          const dateStr = format(workDay, 'yyyy-MM-dd');
          const checkIn = generateCheckInTime();
          const { checkOut, breaks } = generateCheckOutTime(checkIn);
          
          let totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
          
          breaks.forEach((breakTime: any) => {
            const breakDuration = (breakTime.end.getTime() - breakTime.start.getTime()) / (1000 * 60 * 60);
            totalHours -= breakDuration;
          });
          
          const attendance = {
            user: user._id,
            date: dateStr,
            status: randomChoice(['Present', 'Present', 'Present', 'Half_Day']),
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
    const numLeaves = randomBetween(2, 5);
    
    for (let i = 0; i < numLeaves; i++) {
      const startDate = generateRandomDate(leaveStartDate, today);
      const duration = randomBetween(1, 5);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + duration);
      
      const leave = {
        user: user._id,
        type: randomChoice(leaveTypes),
        startDate,
        endDate,
        status: randomChoice(['Approved', 'Approved', 'Pending', 'Rejected']),
        reason: faker.lorem.sentences(2),
        approvedBy: Math.random() > 0.5 ? users[randomBetween(0, users.length - 1)]._id : null
      };
      
      leaveRecords.push(leave);
    }
  }
  
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
    for (let monthOffset = 0; monthOffset < MONTHS_TO_GENERATE; monthOffset++) {
      const monthDate = subMonths(today, monthOffset);
      const monthStr = format(monthDate, 'yyyy-MM');
      
      const basicSalary = user.basicSalary;
      const hra = basicSalary * 0.4;
      const specialAllowance = (user.salaryComponents && user.salaryComponents[1]) ? user.salaryComponents[1].value : randomBetween(5000, 15000);
      const totalEarnings = basicSalary + hra + specialAllowance;
      
      const pfDeduction = basicSalary * (user.salaryConfig.pfRate / 100);
      const professionalTax = user.salaryConfig.professionalTax;
      const totalDeductions = pfDeduction + professionalTax;
      
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
      
      const overtimeHours = randomBetween(0, 20);
      const overtimePay = overtimeHours * (basicSalary / 160) * 1.5;
      
      const adjustedEarnings = (totalEarnings / workDays) * payableDays + overtimePay;
      const netSalary = adjustedEarnings - totalDeductions;
      
      const payroll = {
        user: user._id,
        month: monthStr,
        basicSalary,
        payableDays: Math.round(payableDays * 10) / 10,
        unpaidLeaves: Math.round(unpaidLeaves * 10) / 10,
        totalWorkingHours: attendanceRecords.reduce((sum, record) => sum + (record.totalWorkingHours || 0), 0),
        overtimeHours,
        overtimePay,
        pfDeduction,
        professionalTax,
        totalEarnings: Math.round(adjustedEarnings),
        totalDeductions: Math.round(totalDeductions),
        netSalary: Math.round(netSalary),
        status: randomChoice(['Processed', 'Processed', 'Paid', 'Pending'])
      };
      
      payrollRecords.push(payroll);
    }
  }
  
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
    console.log(`📊 Target: ${TOTAL_RECORDS}+ records per collection for ${MONTHS_TO_GENERATE} months`);
    
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');
    
    const userCount = await User.countDocuments();
    const attendanceCount = await Attendance.countDocuments();
    const leaveCount = await Leave.countDocuments();
    const payrollCount = await Payroll.countDocuments();
    
    console.log(`📈 Current database state:`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Attendance: ${attendanceCount}`);
    console.log(`   Leaves: ${leaveCount}`);
    console.log(`   Payroll: ${payrollCount}`);
    
    let users = await User.find({});
    if (users.length === 0) {
      users = await seedUsers();
    } else {
      console.log(`👥 Using existing ${users.length} users`);
    }
    
    await seedAttendance(users);
    await seedLeaves(users);
    await seedPayroll(users);
    
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
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
