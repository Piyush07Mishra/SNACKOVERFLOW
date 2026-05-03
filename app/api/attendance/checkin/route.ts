import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Attendance } from '@/lib/models/Attendance';
import { auth } from '@/auth';
import { format } from 'date-fns';
import { rateLimit, setSecurityHeaders, createErrorResponse, createSuccessResponse } from '@/lib/security';
import { PushNotificationService } from '@/lib/pushService';

// Get client IP for rate limiting
function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    const response = createErrorResponse('Unauthorized', 401);
    return setSecurityHeaders(response);
  }

  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    if (!rateLimit(`checkin:${session.user.id}`, 10, 60 * 60 * 1000)) { // 10 check-ins per hour
      const response = createErrorResponse('Too many check-in attempts. Please try again later.', 429);
      return setSecurityHeaders(response);
    }

    await dbConnect();
    const today = format(new Date(), 'yyyy-MM-dd');

    // Check if already checked in
    const existing = await Attendance.findOne({
      user: session.user.id,
      date: today
    });

    if (existing) {
      const response = createErrorResponse('Already checked in today', 400);
      return setSecurityHeaders(response);
    }

    const attendance = await Attendance.create({
      user: session.user.id,
      date: today,
      status: 'Present',
      checkIn: new Date(),
      timerStartTime: new Date(), // Set timer start time
    });

    // Send push notification for successful check-in
    try {
      await PushNotificationService.sendAttendanceNotification(
        session.user.id,
        'checkin',
        { checkInTime: attendance.checkIn }
      );
    } catch (pushError) {
      console.error('Push notification error:', pushError);
      // Don't fail the request if push notification fails
    }

    const response = createSuccessResponse({ 
      success: true,
      attendanceId: attendance._id,
      checkInTime: attendance.checkIn
    });
    return setSecurityHeaders(response);

  } catch (error: any) {
    console.error('Check-in error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userId: session?.user?.id
    });
    
    const response = createErrorResponse('Internal Server Error', 500);
    return setSecurityHeaders(response);
  }
}
