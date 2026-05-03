import mongoose from 'mongoose';

const SalaryComponentSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Basic, HRA, Standard Allowance, Performance Bonus, etc.
  computationType: { type: String, enum: ['Fixed', 'Percentage'], default: 'Fixed' },
  value: { type: Number, default: 0 }, // Amount or percentage
  calculatedValue: { type: Number, default: 0 }, // Auto-calculated value
  basisComponent: { type: String, default: '' }, // e.g., "Basic" for HRA which is % of Basic
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [100, 'Email cannot exceed 100 characters']
  },
  employeeId: { 
    type: String, 
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [20, 'Employee ID cannot exceed 20 characters']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    maxlength: [128, 'Password cannot exceed 128 characters'],
    select: false // Never return password in queries
  },
  role: { 
    type: String, 
    enum: ['Admin', 'Employee', 'HR_Officer', 'Payroll_Officer'], 
    default: 'Employee' 
  },
  
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
  },

  // File Uploads
  profileImage: { 
    type: String, 
    default: '' 
  },
  
  documents: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true }, // 'resume', 'certificate', 'identity', 'other'
    filePath: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Performance and security indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ employeeId: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ joiningDate: -1 });

// Text search indexes for better search performance
UserSchema.index({ 
  name: 'text', 
  email: 'text',
  employeeId: 'text',
  jobPosition: 'text'
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
