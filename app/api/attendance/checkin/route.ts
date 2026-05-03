import dbConnect from '@/lib/mongodb';
import { Attendance } from '@/lib/models/Attendance';
import { AttendanceSession } from '@/lib/models/AttendanceSession';
import { User } from '@/lib/models/User';
import { auth } from '@/auth';
import { format } from 'date-fns';
import { rateLimit, setSecurityHeaders, createErrorResponse, createSuccessResponse } from '@/lib/security';

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
    const body = await req.json().catch(() => ({}));
    const { employeeId, lat, lng, accuracy } = body as {
      employeeId?: string;
      lat?: number;
      lng?: number;
      accuracy?: number;
    };

    // Rate limiting
    const clientIP = getClientIP(req);
    if (!rateLimit(`checkin:${session.user.id}`, 10, 60 * 60 * 1000)) { // 10 check-ins per hour
      const response = createErrorResponse('Too many check-in attempts. Please try again later.', 429);
      return setSecurityHeaders(response);
    }

    await dbConnect();
    const currentUser = await User.findById(session.user.id)
      .select('_id companyId employeeId role')
      .lean();
    if (!currentUser?.companyId || !currentUser.employeeId) {
      const response = createErrorResponse('User profile is incomplete', 400);
      return setSecurityHeaders(response);
    }
    if (currentUser.role !== 'Employee') {
      const response = createErrorResponse('Only employees can use attendance check-in', 403);
      return setSecurityHeaders(response);
    }

    const payloadEmployeeId = employeeId?.trim() || currentUser.employeeId;
    if (payloadEmployeeId !== currentUser.employeeId) {
      const response = createErrorResponse('Wrong QR for this user', 403);
      return setSecurityHeaders(response);
    }

    if (
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 || lat > 90 ||
      lng < -180 || lng > 180
    ) {
      const response = createErrorResponse('employeeId, lat, lng are required', 400);
      return setSecurityHeaders(response);
    }

    const today = format(new Date(), 'yyyy-MM-dd');

    const existingAttendance = await Attendance.findOne({
      user: currentUser._id,
      date: today,
    });

    if (existingAttendance) {
      if (existingAttendance.checkOut) {
        const response = createErrorResponse('You have already completed attendance for today.', 400);
        return setSecurityHeaders(response);
      }
      const response = createErrorResponse('You are already checked in for today.', 400);
      return setSecurityHeaders(response);
    }

    // Prevent multiple active sessions for the same employee.
    const activeSession = await AttendanceSession.findOne({
      companyId: currentUser.companyId,
      employeeId: payloadEmployeeId,
      userId: currentUser._id,
      status: 'ACTIVE',
    });

    if (activeSession) {
      const response = createErrorResponse('Already checked in. Active session exists.', 400);
      return setSecurityHeaders(response);
    }

    const now = new Date();

    const attendanceSession = await AttendanceSession.create({
      companyId: currentUser.companyId,
      employeeId: payloadEmployeeId,
      userId: currentUser._id,
      checkInTime: now,
      checkInLocation: {
        lat,
        lng,
        accuracy: typeof accuracy === 'number' ? accuracy : null,
      },
      status: 'ACTIVE',
    });

    await Attendance.create({
      companyId: currentUser.companyId,
      employeeId: payloadEmployeeId,
      user: currentUser._id,
      date: today,
      status: 'Present',
      checkIn: now,
      timerStartTime: now,
    });

    const response = createSuccessResponse({ 
      success: true,
      sessionId: attendanceSession._id,
      employeeId: payloadEmployeeId,
      checkInTime: attendanceSession.checkInTime,
      message: 'Checked in successfully',
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
