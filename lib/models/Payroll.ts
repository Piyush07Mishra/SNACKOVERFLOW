import mongoose from 'mongoose';

const PayrollSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true }, // Format: YYYY-MM
  basicSalary: { type: Number, required: true },
  pfDeduction: { type: Number, required: true }, // 12% of basic
  professionalTax: { type: Number, required: true },
  totalEarnings: { type: Number, required: true },
  totalDeductions: { type: Number, required: true },
  netSalary: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Processed', 'Paid'], default: 'Pending' },
}, { timestamps: true });

PayrollSchema.index({ user: 1, month: 1 }, { unique: true });

export const Payroll = mongoose.models.Payroll || mongoose.model('Payroll', PayrollSchema);
