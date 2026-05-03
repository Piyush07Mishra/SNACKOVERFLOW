import webpush from 'web-push';
import { Notification } from './models/Notification';
import { User } from './models/User';
import dbConnect from './mongodb';

// VAPID keys configuration
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || '';
const email = process.env.VAPID_EMAIL || 'noreply@empay.com';

if (!publicVapidKey || !privateVapidKey) {
  console.warn('VAPID keys not configured. Push notifications will not work.');
}

webpush.setVapidDetails(
  `mailto:${email}`,
  publicVapidKey,
  privateVapidKey
);

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: {
    url?: string;
    type?: string;
    id?: string;
    [key: string]: any;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

export class PushNotificationService {
  /**
   * Send push notification to a specific user
   */
  static async sendToUser(
    userId: string,
    payload: NotificationPayload,
    options?: {
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      ttl?: number;
    }
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    await dbConnect();
    
    const user = await User.findById(userId);
    if (!user || !user.pushSubscription) {
      return { success: 0, failed: 1, errors: ['User not found or no push subscription'] };
    }

    try {
      await webpush.sendNotification(
        user.pushSubscription as PushSubscription,
        JSON.stringify(payload),
        {
          TTL: options?.ttl || 3600, // 1 hour default
          urgency: (options?.priority === 'urgent' ? 'high' : options?.priority) as any || 'normal'
        }
      );
      
      // Store notification in database
      await Notification.create({
        user: userId,
        title: payload.title,
        message: payload.body,
        type: payload.data?.type || 'system',
        priority: options?.priority || 'medium',
        actionUrl: payload.data?.url,
        metadata: payload.data,
        pushSent: true,
        pushSubscription: user.pushSubscription
      });

      return { success: 1, failed: 0, errors: [] };
    } catch (error) {
      console.error('Push notification error:', error);
      
      // If subscription is invalid, remove it
      if (error instanceof Error && error.message.includes('410')) {
        await User.findByIdAndUpdate(userId, { $unset: { pushSubscription: 1 } });
        return { success: 0, failed: 1, errors: ['Subscription expired and removed'] };
      }
      
      return { success: 0, failed: 1, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  /**
   * Send push notification to multiple users
   */
  static async sendToMultipleUsers(
    userIds: string[],
    payload: NotificationPayload,
    options?: {
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      ttl?: number;
    }
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };
    
    // Send notifications in parallel batches
    const batchSize = 10;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const batchPromises = batch.map(userId => 
        this.sendToUser(userId, payload, options).catch(error => ({ success: 0, failed: 1, errors: [error.message] }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(result => {
        results.success += result.success;
        results.failed += result.failed;
        results.errors.push(...result.errors);
      });
    }
    
    return results;
  }

  /**
   * Send notification to all users with a specific role
   */
  static async sendToRole(
    role: string,
    payload: NotificationPayload,
    options?: {
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      ttl?: number;
    }
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    await dbConnect();
    
    const users = await User.find({ 
      role, 
      pushSubscription: { $exists: true, $ne: null } 
    }).select('_id');
    
    const userIds = users.map(user => user._id.toString());
    return this.sendToMultipleUsers(userIds, payload, options);
  }

  /**
   * Send attendance-related notifications
   */
  static async sendAttendanceNotification(
    userId: string,
    type: 'checkin' | 'checkout' | 'break_start' | 'break_end' | 'absent',
    data?: any
  ) {
    const payloads = {
      checkin: {
        title: 'Check-in Successful',
        body: `You have successfully checked in at ${new Date().toLocaleTimeString()}`,
        data: { type: 'attendance', action: 'checkin', url: '/dashboard/attendance' }
      },
      checkout: {
        title: 'Check-out Successful',
        body: `You have successfully checked out at ${new Date().toLocaleTimeString()}`,
        data: { type: 'attendance', action: 'checkout', url: '/dashboard/attendance' }
      },
      break_start: {
        title: 'Break Started',
        body: `Your break has started at ${new Date().toLocaleTimeString()}`,
        data: { type: 'attendance', action: 'break_start', url: '/dashboard/attendance' }
      },
      break_end: {
        title: 'Break Ended',
        body: `Your break has ended at ${new Date().toLocaleTimeString()}`,
        data: { type: 'attendance', action: 'break_end', url: '/dashboard/attendance' }
      },
      absent: {
        title: 'Attendance Reminder',
        body: 'You have not checked in today. Please mark your attendance.',
        data: { type: 'attendance', action: 'reminder', url: '/dashboard/attendance' },
        requireInteraction: true
      }
    };

    const payload = payloads[type];
    if (payload) {
      return this.sendToUser(userId, payload, { priority: type === 'absent' ? 'high' : 'medium' });
    }
  }

  /**
   * Send leave-related notifications
   */
  static async sendLeaveNotification(
    userId: string,
    type: 'submitted' | 'approved' | 'rejected',
    leaveData?: any
  ) {
    const payloads = {
      submitted: {
        title: 'Leave Request Submitted',
        body: `Your leave request has been submitted for review`,
        data: { type: 'leave', action: 'submitted', url: '/dashboard/leave' }
      },
      approved: {
        title: 'Leave Request Approved',
        body: `Your leave request has been approved!`,
        data: { type: 'leave', action: 'approved', url: '/dashboard/leave' }
      },
      rejected: {
        title: 'Leave Request Rejected',
        body: `Your leave request has been rejected. Please check details.`,
        data: { type: 'leave', action: 'rejected', url: '/dashboard/leave' },
        requireInteraction: true
      }
    };

    const payload = payloads[type];
    if (payload) {
      return this.sendToUser(userId, payload, { priority: type === 'approved' ? 'medium' : 'high' });
    }
  }

  /**
   * Send payroll-related notifications
   */
  static async sendPayrollNotification(
    userId: string,
    type: 'processed' | 'paid',
    payrollData?: any
  ) {
    const payloads = {
      processed: {
        title: 'Payroll Processed',
        body: `Your payroll for ${payrollData?.month || 'this month'} has been processed`,
        data: { type: 'payroll', action: 'processed', url: '/dashboard/payroll' }
      },
      paid: {
        title: 'Salary Credited',
        body: `Your salary has been credited! Check your payslip for details.`,
        data: { type: 'payroll', action: 'paid', url: '/dashboard/payroll' },
        requireInteraction: true
      }
    };

    const payload = payloads[type];
    if (payload) {
      return this.sendToUser(userId, payload, { priority: 'high' });
    }
  }

  /**
   * Generate VAPID keys (for development)
   */
  static generateVAPIDKeys() {
    return webpush.generateVAPIDKeys();
  }
}
