import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema(
  {
    // Tenant isolation
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    // Denormalized for fast queries (avoids joins)
    employeeId: { type: String, default: '' },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Half_Day'],
      default: 'Present',
    },
    checkIn: { type: Date },
    checkOut: { type: Date },
    timerStartTime: { type: Date },
    breaks: [
      {
        start: { type: Date },
        end: { type: Date },
      },
    ],
    notes: { type: String, default: '' },
    totalWorkingHours: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One attendance record per user per day
AttendanceSchema.index({ user: 1, date: 1 }, { unique: true });
// Fast company-scoped queries
AttendanceSchema.index({ companyId: 1, date: 1 });

export const Attendance =
  mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
