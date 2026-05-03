import { format, differenceInMinutes } from 'date-fns';
import dbConnect from '@/lib/mongodb';
import { auth } from '@/auth';
import { User } from '@/lib/models/User';
import { Attendance } from '@/lib/models/Attendance';
import { AttendanceSession } from '@/lib/models/AttendanceSession';
import { getDistanceMeters } from '@/lib/geo';
import { createErrorResponse, createSuccessResponse, setSecurityHeaders } from '@/lib/security';

const MAX_CHECKOUT_DISTANCE_METERS = 500;

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
}

function isValidCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return setSecurityHeaders(createErrorResponse('Unauthorized', 401));
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { employeeId, lat, lng, accuracy } = body as {
      employeeId?: string;
      lat?: number;
      lng?: number;
      accuracy?: number;
    };

    if (!employeeId || !isValidCoordinate(lat, -90, 90) || !isValidCoordinate(lng, -180, 180)) {
      return setSecurityHeaders(createErrorResponse('employeeId, lat, lng are required', 400));
    }

    await dbConnect();

    const currentUser = await User.findById(session.user.id).select('_id companyId employeeId role').lean();
    if (!currentUser?.companyId || !currentUser.employeeId) {
      return setSecurityHeaders(createErrorResponse('User profile is incomplete', 400));
    }
    if (currentUser.role !== 'Employee') {
      return setSecurityHeaders(createErrorResponse('Only employees can use attendance check-out', 403));
    }

    // Prevent wrong QR usage: logged-in employee must match the QR employeeId.
    if (currentUser.employeeId !== employeeId) {
      return setSecurityHeaders(createErrorResponse('Wrong QR for this user', 403));
    }

    const activeSession = await AttendanceSession.findOne({
      companyId: currentUser.companyId,
      employeeId,
      userId: currentUser._id,
      status: 'ACTIVE',
    });

    if (!activeSession) {
      return setSecurityHeaders(createErrorResponse('No active check-in session found', 400));
    }

    const distanceMeters = getDistanceMeters(
      activeSession.checkInLocation.lat,
      activeSession.checkInLocation.lng,
      lat,
      lng
    );

    if (distanceMeters > MAX_CHECKOUT_DISTANCE_METERS) {
      return setSecurityHeaders(
        createErrorResponse(
          `Checkout denied. Distance from check-in location is ${Math.round(distanceMeters)}m (max ${MAX_CHECKOUT_DISTANCE_METERS}m).`,
          400
        )
      );
    }

    const now = new Date();
    activeSession.checkOutTime = now;
    activeSession.checkOutLocation = { lat, lng, accuracy: typeof accuracy === 'number' ? accuracy : null };
    activeSession.status = 'COMPLETED';
    await activeSession.save();

    // Keep existing daily attendance reports in sync.
    const checkInDate = format(new Date(activeSession.checkInTime), 'yyyy-MM-dd');
    const attendance = await Attendance.findOne({ user: currentUser._id, date: checkInDate });
    if (attendance && !attendance.checkOut) {
      attendance.checkOut = now;
      let totalMinutes = differenceInMinutes(now, attendance.checkIn);
      let breakMinutes = 0;
      if (attendance.breaks?.length) {
        attendance.breaks.forEach((b: any) => {
          if (b.start && b.end) {
            breakMinutes += differenceInMinutes(b.end, b.start);
          } else if (b.start && !b.end) {
            b.end = now;
            breakMinutes += differenceInMinutes(now, b.start);
          }
        });
      }
      attendance.totalWorkingHours = Math.max((totalMinutes - breakMinutes) / 60, 0);
      await attendance.save();
    }

    return setSecurityHeaders(
      createSuccessResponse({
        success: true,
        employeeId,
        checkOutTime: now,
        distanceMeters: Math.round(distanceMeters),
        message: 'Checked out successfully',
      })
    );
  } catch (error: any) {
    console.error('Checkout error:', {
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      userId: session.user.id,
      ip: getClientIP(req),
    });
    return setSecurityHeaders(createErrorResponse('Internal Server Error', 500));
  }
}
