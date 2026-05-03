import mongoose from 'mongoose';

const SalaryComponentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    computationType: {
      type: String,
      enum: ['Fixed', 'Percentage'],
      default: 'Fixed',
    },
    value: { type: Number, default: 0 },
    calculatedValue: { type: Number, default: 0 },
    basisComponent: { type: String, default: '' },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },

    // Split name for deterministic employee ID generation
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    // Computed full name — kept for backward compat with existing queries
    name: { type: String, trim: true },

    email: { type: String, required: true },

    // Deterministic ID e.g. "OIPIMI20250001" — unique per company
    employeeId: { type: String, sparse: true },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ['Admin', 'Employee', 'HR_Officer', 'Payroll_Officer'],
      default: 'Employee',
    },

    // Work Info
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
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', ''],
      default: '',
    },
    maritalStatus: { type: String, default: '' },
    joiningDate: { type: Date, required: true },

    // Salary Info
    wageType: { type: String, enum: ['Fixed', 'Variable'], default: 'Fixed' },
    basicSalary: { type: Number, default: 0 },
    salaryComponents: [SalaryComponentSchema],
    salaryConfig: {
      pfRate: { type: Number, default: 12 },
      professionalTax: { type: Number, default: 200 },
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
  },
  { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
// employeeId is unique WITHIN a company (not globally)
UserSchema.index({ companyId: 1, employeeId: 1 }, { unique: true, sparse: true });
// email is unique WITHIN a company (multi-tenant safe)
UserSchema.index({ companyId: 1, email: 1 }, { unique: true });

// NOTE: The `name` field is set explicitly on create/update via service layer.
// No pre-hook needed — avoids Mongoose TS strict-mode issues.

// Performance and security indexes
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
