import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PushNotificationService } from '@/lib/pushService';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Send test push notification
    const result = await PushNotificationService.sendToUser(
      session.user.id,
      {
        title: 'Test Notification',
        body: 'This is a test push notification from EmPay!',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: {
          type: 'system',
          url: '/dashboard',
          timestamp: new Date().toISOString()
        },
        requireInteraction: false
      },
      { priority: 'medium', ttl: 3600 }
    );

    if (result.success > 0) {
      return NextResponse.json({
        success: true,
        message: 'Test notification sent successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send test notification',
        errors: result.errors
      });
    }

  } catch (error) {
    console.error('Test notification error:', error);
    
    return NextResponse.json(
      { success: false, message: 'Failed to send test notification' },
      { status: 500 }
    );
  }
}
