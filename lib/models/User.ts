import mongoose from 'mongoose';

const SalaryComponentSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Basic, HRA, Standard Allowance, Performance Bonus, etc.
  computationType: { type: String, enum: ['Fixed', 'Percentage'], default: 'Fixed' },
  value: { type: Number, default: 0 }, // Amount or percentage
  calculatedValue: { type: Number, default: 0 }, // Auto-calculated value
  basisComponent: { type: String, default: '' }, // e.g., "Basic" for HRA which is % of Basic
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  employeeId: { type: String, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Employee', 'HR_Officer', 'Payroll_Officer'], default: 'Employee' },
  
  // Resume Info
  jobPosition: { type: String, default: '' },
  mobileNumber: { type: String, default: '' },
  company: { type: String, default: '' },
  department: { type: String, default: '' },
  manager: { type: String, default: '' },
  location: { type: String, default: '' },
  
  // Private Info
  dateOfBirth: { type: Date, default: null },
  residingAddress: { type: String, default: '' },
  nationality: { type: String, default: '' },
  personalEmail: { type: String, default: '' },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  maritalStatus: { type: String, default: '' },
  joiningDate: { type: Date, default: Date.now },
  
  // Salary Info
  wageType: { type: String, enum: ['Fixed', 'Variable'], default: 'Fixed' },
  basicSalary: { type: Number, default: 0 }, // This is the wage amount
  
  // Salary Components
  salaryComponents: [SalaryComponentSchema],
  
  // Salary Configuration
  salaryConfig: {
    pfRate: { type: Number, default: 12 }, // PF rate %
    professionalTax: { type: Number, default: 200 }, // Fixed amount
  },
  
  // Bank Details
  bankDetails: {
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    branchName: { type: String, default: '' },
    panNo: { type: String, default: '' },
    uanNo: { type: String, default: '' },
  },
  
  // Admin Permissions
  adminPermissions: {
    canApproveLeaves: { type: Boolean, default: false },
    canApprovePay: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
  }
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
