import mongoose from 'mongoose';

const LocationSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    accuracy: { type: Number, default: null },
  },
  { _id: false }
);

const AttendanceSessionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    employeeId: { type: String, required: true, index: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    checkInTime: { type: Date, required: true },
    checkOutTime: { type: Date, default: null },
    checkInLocation: { type: LocationSchema, required: true },
    checkOutLocation: { type: LocationSchema, default: null },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  { timestamps: true }
);

// Allow only one ACTIVE session per employee inside a company.
AttendanceSessionSchema.index(
  { companyId: 1, employeeId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'ACTIVE' },
  }
);

AttendanceSessionSchema.index({ companyId: 1, employeeId: 1, createdAt: -1 });

export const AttendanceSession =
  mongoose.models.AttendanceSession ||
  mongoose.model('AttendanceSession', AttendanceSessionSchema);
