import mongoose from 'mongoose';

const PayrollSchema = new mongoose.Schema(
  {
    // Tenant isolation
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    // Denormalized for fast queries and PDF generation
    employeeId: { type: String, default: '' },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true }, // Format: YYYY-MM
    basicSalary: { type: Number, required: true },
    payableDays: { type: Number, required: true },
    unpaidLeaves: { type: Number, default: 0 },
    pfDeduction: { type: Number, required: true }, // 12% of basic
    professionalTax: { type: Number, required: true },
    totalEarnings: { type: Number, required: true },
    totalDeductions: { type: Number, required: true },
    netSalary: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Processed', 'Paid'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

// One payroll record per user per month
PayrollSchema.index({ user: 1, month: 1 }, { unique: true });
// Fast company-scoped payroll queries
PayrollSchema.index({ companyId: 1, month: 1 });

export const Payroll =
  mongoose.models.Payroll || mongoose.model('Payroll', PayrollSchema);
