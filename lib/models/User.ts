import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Employee', 'HR_Officer', 'Payroll_Officer'], default: 'Employee' },
  designation: { type: String, default: '' },
  department: { type: String, default: '' },
  joiningDate: { type: Date, default: Date.now },
  basicSalary: { type: Number, default: 0 },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
