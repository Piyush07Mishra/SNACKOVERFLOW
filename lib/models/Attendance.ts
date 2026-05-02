import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { 
    type: String, 
    required: [true, 'Date is required'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format']
  },
  status: { 
    type: String, 
    enum: ['Present', 'Absent', 'Half_Day', 'Leave'], 
    default: 'Present',
    required: [true, 'Status is required']
  },
  checkIn: { 
    type: Date,
    validate: {
      validator: function(value: Date) {
        return !value || value <= new Date();
      },
      message: 'Check-in time cannot be in the future'
    }
  },
  checkOut: { 
    type: Date,
    validate: {
      validator: function(value: Date) {
        if (!value) return true;
        return !this.checkIn || value >= this.checkIn;
      },
      message: 'Check-out time must be after check-in time'
    }
  },
  breaks: [{
    start: { 
      type: Date,
      required: [true, 'Break start time is required']
    },
    end: { 
      type: Date,
      validate: {
        validator: function(value: Date) {
          if (!value) return true;
          return !this.start || value >= this.start;
        },
        message: 'Break end time must be after start time'
      }
    }
  }],
  totalWorkingHours: { 
    type: Number, 
    default: 0,
    min: [0, 'Working hours cannot be negative'],
    max: [24, 'Working hours cannot exceed 24 hours']
  },
  notes: { 
    type: String, 
    default: '',
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    trim: true
  },
  timerStartTime: { type: Date }, // For real-time tracking
  lastBreakStart: { type: Date }, // For break tracking
  employeeId: { 
    type: String, 
    uppercase: true,
    trim: true,
    maxlength: [20, 'Employee ID cannot exceed 20 characters']
  }
}, { timestamps: true });

// Performance indexes
AttendanceSchema.index({ user: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: -1 }); // For date-based queries
AttendanceSchema.index({ status: 1 }); // For status filtering
AttendanceSchema.index({ user: 1, status: 1 }); // For user status queries
AttendanceSchema.index({ user: 1, date: -1 }); // For user attendance history

// Compound indexes for common queries
AttendanceSchema.index({ 
  date: -1, 
  status: 1 
}); // For monthly attendance reports

export const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
