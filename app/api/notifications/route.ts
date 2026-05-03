import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Notification } from '@/lib/models/Notification';
import dbConnect from '@/lib/mongodb';
import { z } from 'zod';

const notificationQuerySchema = z.object({
  page: z.string().transform(Number).default(1),
  limit: z.string().transform(Number).default(20),
  unread: z.string().transform(val => val === 'true').optional(),
  type: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const validatedQuery = notificationQuerySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      unread: searchParams.get('unread'),
      type: searchParams.get('type')
    });

    await dbConnect();

    const { page, limit, unread, type } = validatedQuery;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { user: session.user.id };
    if (unread) {
      query.isRead = false;
    }
    if (type) {
      query.type = type;
    }

    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title message type priority isRead actionUrl actionText createdAt metadata')
      .lean();

    // Get total count for pagination
    const total = await Notification.countDocuments(query);

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      user: session.user.id,
      isRead: false
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications: notifications.map(notification => ({
          id: notification._id.toString(),
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          isRead: notification.isRead,
          actionUrl: notification.actionUrl,
          actionText: notification.actionText,
          createdAt: notification.createdAt,
          metadata: notification.metadata
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        unreadCount
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid query parameters',
          errors: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationIds, markAsRead } = body;

    await dbConnect();

    if (markAsRead && notificationIds?.length > 0) {
      // Mark specific notifications as read
      await Notification.updateMany(
        { 
          _id: { $in: notificationIds },
          user: session.user.id
        },
        { isRead: true }
      );

      return NextResponse.json({
        success: true,
        message: 'Notifications marked as read'
      });
    } else if (markAsRead === true && !notificationIds) {
      // Mark all notifications as read
      await Notification.updateMany(
        { user: session.user.id, isRead: false },
        { isRead: true }
      );

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid request' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Update notifications error:', error);
    
    return NextResponse.json(
      { success: false, message: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
