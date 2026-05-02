import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  employeeId: { type: String, required: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Keeping 'password' naming consistent with existing logic
  role: { type: String, enum: ['ADMIN', 'HR', 'PAYROLL', 'EMPLOYEE'], required: true },
  phone: { type: String, default: '' },
  avatar: { type: String, default: '' },
  department: { type: String, default: '' },
  designation: { type: String, default: '' },
  dateOfJoining: { type: Date, default: Date.now },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
  address: { type: String, default: '' },
  bankDetails: {
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    branchName: { type: String, default: '' },
  },
  salary: {
    basic: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    pfContrib: { type: Number, default: 12 },
    professionalTax: { type: Number, default: 200 },
  },
  leaveBalance: {
    casual: { type: Number, default: 12 },
    sick: { type: Number, default: 6 },
    earned: { type: Number, default: 15 },
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Indexes for optimal querying
UserSchema.index({ companyId: 1 });
UserSchema.index({ companyId: 1, role: 1 });
UserSchema.index({ companyId: 1, employeeId: 1 }, { unique: true });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
