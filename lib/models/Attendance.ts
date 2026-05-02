import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  status: { type: String, enum: ['Present', 'Absent', 'Half_Day'], default: 'Present' },
  checkIn: { type: Date },
  checkOut: { type: Date },
}, { timestamps: true });

// Ensure one attendance per user per day
AttendanceSchema.index({ user: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
