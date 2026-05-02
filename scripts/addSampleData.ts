import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import dbConnect from '../lib/mongodb';
import { User } from '../lib/models/User';

// Load environment variables
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env.local');

console.log('Loading env from:', envPath);
dotenv.config({ path: envPath });
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');

// Sample data generators
const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica', 
  'William', 'Ashley', 'James', 'Amanda', 'Christopher', 'Melissa', 'Daniel', 
  'Stephanie', 'Matthew', 'Rebecca', 'Anthony', 'Lauren', 'Mark', 'Kimberly',
  'Steven', 'Lisa', 'Andrew', 'Michelle', 'Joshua', 'Amy', 'Kevin', 'Angela',
  'Brian', 'Brenda', 'George', 'Pamela', 'Edward', 'Nicole', 'Ronald', 'Katherine',
  'Timothy', 'Christine', 'Jason', 'Samantha', 'Jeffrey', 'Deborah', 'Ryan', 'Rachel',
  'Jacob', 'Carol', 'Gary', 'Sharon', 'Nicholas', 'Laura', 'Eric', 'Sarah',
  'Jonathan', 'Kimberly', 'Stephen', 'Heather', 'Larry', 'Tiffany', 'Justin', 'Maria',
  'Scott', 'Megan', 'Brandon', 'Elizabeth', 'Benjamin', 'Jennifer', 'Samuel', 'Linda',
  'Frank', 'Patricia', 'Raymond', 'Barbara', 'Alexander', 'Susan', 'Patrick', 'Jessica',
  'Jack', 'Nancy', 'Dennis', 'Betty', 'Jerry', 'Helen', 'Tyler', 'Sandra',
  'Henry', 'Donna', 'Peter', 'Cynthia', 'Christian', 'Carolyn', 'Sean', 'Julie',
  'Philip', 'Anna', 'Chris', 'Wanda', 'Johnny', 'Beverly', 'Earl', 'Virginia',
  'Jimmy', 'Brandon', 'Antonio', 'Kathryn', 'Jeremy', 'Christina', 'Keith', 'Frances',
  'Terry', 'Teresa', 'Alan', 'Rachel', 'Luis', 'Janet', 'Albert', 'Emma'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill',
  'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell',
  'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz',
  'Parker', 'Cruz', 'Edwards', 'Collins', 'Stewart', 'Morris', 'Morales', 'Murphy',
  'Rogers', 'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey', 'Rivera',
  'Cooper', 'Richardson', 'Cox', 'Howard', 'Ward', 'Torres', 'Peterson', 'Gray',
  'Ramirez', 'James', 'Watson', 'Brooks', 'Kelly', 'Sanders', 'Price', 'Bennett',
  'Wood', 'Barnes', 'Ross', 'Henderson', 'Coleman', 'Jenkins', 'Perry', 'Powell',
  'Long', 'Patterson', 'Hughes', 'Flores', 'Washington', 'Butler', 'Simmons',
  'Foster', 'Gonzales', 'Bryant', 'Alexander', 'Russell', 'Griffin', 'Diaz',
  'Hayes'
];

const departments = [
  'Engineering', 'Marketing', 'Sales', 'Human Resources', 'Finance', 'Operations',
  'IT', 'Customer Service', 'Product', 'Design', 'Legal', 'Administration'
];

const jobPositions = [
  'Software Engineer', 'Senior Software Engineer', 'Frontend Developer', 'Backend Developer',
  'Full Stack Developer', 'DevOps Engineer', 'QA Engineer', 'Product Manager',
  'Marketing Manager', 'Sales Representative', 'Sales Manager', 'HR Specialist',
  'HR Manager', 'Financial Analyst', 'Accountant', 'Operations Manager',
  'IT Support', 'System Administrator', 'UX Designer', 'UI Designer',
  'Graphic Designer', 'Legal Counsel', 'Administrative Assistant', 'Office Manager',
  'Business Analyst', 'Data Analyst', 'Project Manager', 'Team Lead',
  'Technical Lead', 'Engineering Manager', 'Marketing Director', 'Sales Director'
];

const companies = [
  'TechCorp Solutions', 'Global Systems Inc', 'Digital Innovations Ltd', 'CloudTech',
  'DataDriven Enterprises', 'SmartSoft Technologies', 'Future Systems', 'Innovation Hub',
  'TechGiant Corporation', 'Digital Dynamics', 'CloudFirst Solutions', 'DataTech Pro',
  'SmartSystems Inc', 'Innovation Labs', 'TechForward', 'Digital Edge',
  'CloudMasters', 'DataWizards', 'TechVision', 'Digital Nexus'
];

function getRandomElement(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomEmail(firstName: string, lastName: string, company: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com'];
  const domain = getRandomElement(domains);
  const companyDomain = company.toLowerCase().replace(/\s+/g, '') + '.com';
  return Math.random() > 0.5 
    ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`
    : `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${companyDomain}`;
}

function generateEmployeeId(): string {
  return 'EMP' + Math.floor(10000 + Math.random() * 90000);
}

function generateRandomSalary(): number {
  const baseSalaries = [35000, 45000, 55000, 65000, 75000, 85000, 95000, 105000, 120000, 150000];
  return baseSalaries[Math.floor(Math.random() * baseSalaries.length)] + Math.floor(Math.random() * 10000);
}

function generateRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function generateSampleData(count: number = 1000) {
  try {
    await dbConnect();
    
    console.log(`Connected to database. Generating ${count} sample employees...`);
    
    const existingUsers = await User.countDocuments();
    console.log(`Current user count: ${existingUsers}`);
    
    const users = [];
    const batchSize = 100;
    
    for (let i = 0; i < count; i++) {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const company = getRandomElement(companies);
      const department = getRandomElement(departments);
      const jobPosition = getRandomElement(jobPositions);
      
      const email = generateRandomEmail(firstName, lastName, company);
      const employeeId = generateEmployeeId();
      const password = 'password123'; // Default password for all sample users
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Generate realistic joining date (within last 5 years)
      const joiningDate = generateRandomDate(
        new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000),
        new Date()
      );
      
      // Generate date of birth (between 22 and 65 years old)
      const dateOfBirth = generateRandomDate(
        new Date(Date.now() - 65 * 365 * 24 * 60 * 60 * 1000),
        new Date(Date.now() - 22 * 365 * 24 * 60 * 60 * 1000)
      );
      
      // Random role distribution
      const roles = ['Employee', 'Employee', 'Employee', 'Employee', 'Employee', 'Employee', 'Employee', 'HR_Officer', 'Payroll_Officer'];
      const role = getRandomElement(roles);
      
      const user = {
        name: `${firstName} ${lastName}`,
        email,
        employeeId,
        password: hashedPassword,
        role,
        jobPosition,
        mobileNumber: `+1${Math.floor(2000000000 + Math.random() * 8000000000)}`,
        company,
        department,
        manager: Math.random() > 0.3 ? `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}` : '',
        location: getRandomElement(['New York', 'San Francisco', 'Chicago', 'Austin', 'Seattle', 'Boston', 'Denver', 'Miami']),
        dateOfBirth,
        residingAddress: `${Math.floor(100 + Math.random() * 999)} ${getRandomElement(['Main St', 'Oak Ave', 'Pine Rd', 'Elm Dr', 'Maple Ln'])}, ${getRandomElement(['NY', 'CA', 'TX', 'WA', 'CO', 'FL'])} ${Math.floor(10000 + Math.random() * 90000)}`,
        nationality: 'US',
        personalEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@personal.com`,
        gender: getRandomElement(['Male', 'Female', 'Other']),
        maritalStatus: getRandomElement(['Single', 'Married', 'Divorced', '']),
        joiningDate,
        wageType: getRandomElement(['Fixed', 'Variable']),
        basicSalary: generateRandomSalary(),
        bankDetails: {
          bankName: getRandomElement(['Chase', 'Bank of America', 'Wells Fargo', 'Citibank', 'US Bank']),
          accountNumber: `####${Math.floor(1000 + Math.random() * 9000)}`,
          ifscCode: `CHAS${Math.floor(100000 + Math.random() * 900000)}`,
          branchName: `${getRandomElement(['Downtown', 'Uptown', 'Midtown', 'Suburban'])} Branch`,
          panNo: `${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          uanNo: `UAN${Math.floor(100000000 + Math.random() * 900000000)}`
        },
        salaryConfig: {
          pfRate: 12,
          professionalTax: 200
        },
        adminPermissions: {
          canApproveLeaves: role === 'HR_Officer',
          canApprovePay: role === 'Payroll_Officer',
          canManageUsers: role === 'Admin',
          canViewReports: ['HR_Officer', 'Payroll_Officer'].includes(role)
        }
      };
      
      users.push(user);
      
      // Insert in batches to avoid memory issues
      if (users.length >= batchSize) {
        await User.insertMany(users, { ordered: false });
        console.log(`Inserted ${users.length} users (Total: ${i + users.length}/${count})`);
        users.length = 0;
      }
    }
    
    // Insert remaining users
    if (users.length > 0) {
      await User.insertMany(users, { ordered: false });
      console.log(`Inserted final batch of ${users.length} users`);
    }
    
    const finalCount = await User.countDocuments();
    console.log(`✅ Successfully added ${count} sample users!`);
    console.log(`📊 Total users in database: ${finalCount}`);
    console.log(`🔑 Default password for all sample users: password123`);
    
  } catch (error: any) {
    console.error('❌ Error generating sample data:', error.message);
    if (error.code === 11000) {
      console.log('⚠️  Some duplicate entries were skipped (expected with random generation)');
    }
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
if (require.main === module) {
  generateSampleData(1000);
}

export { generateSampleData };
