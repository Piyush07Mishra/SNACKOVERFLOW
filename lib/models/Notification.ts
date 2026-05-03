import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, maxlength: [100, 'Title cannot exceed 100 characters'] },
  message: { type: String, required: true, maxlength: [500, 'Message cannot exceed 500 characters'] },
  type: { 
    type: String, 
    enum: ['attendance', 'leave', 'payroll', 'system', 'reminder', 'approval'],
    required: true 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium' 
  },
  isRead: { type: Boolean, default: false },
  actionUrl: { type: String }, // URL to redirect when clicked
  actionText: { type: String }, // Button text for action
  metadata: { type: mongoose.Schema.Types.Mixed }, // Additional data
  expiresAt: { type: Date }, // Auto-expire notifications
  pushSent: { type: Boolean, default: false }, // Track if push notification was sent
  pushSubscription: { type: mongoose.Schema.Types.Mixed }, // Store push subscription details
}, { timestamps: true });

// Indexes for performance
NotificationSchema.index({ user: 1, isRead: 1 });
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, priority: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// TTL index to auto-delete expired notifications
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
