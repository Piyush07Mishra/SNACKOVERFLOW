import mongoose from 'mongoose';

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
  basicSalary: { type: Number, default: 0 },
  salaryStructure: { type: String, default: '' },
  
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
