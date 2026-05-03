import mongoose from 'mongoose';

const LeaveSchema = new mongoose.Schema(
  {
    // Tenant isolation
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    // Denormalized for fast queries
    employeeId: { type: String, default: '' },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['Sick', 'Casual', 'Earned', 'Unpaid'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    reason: { type: String, required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Fast company-scoped queries
LeaveSchema.index({ companyId: 1, status: 1 });

export const Leave =
  mongoose.models.Leave || mongoose.model('Leave', LeaveSchema);
