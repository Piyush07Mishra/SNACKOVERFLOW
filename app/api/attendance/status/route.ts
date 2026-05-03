import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Attendance } from '@/lib/models/Attendance';
import { AttendanceSession } from '@/lib/models/AttendanceSession';
import { User } from '@/lib/models/User';
import { auth } from '@/auth';
import { format } from 'date-fns';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const url = new URL(req.url);
    const empIdFromQuery = url.searchParams.get('empId')?.trim();

    const currentUser = await User.findById(session.user.id).select('_id companyId employeeId role').lean();
    if (!currentUser?.companyId || !currentUser.employeeId) {
      return NextResponse.json({ error: 'User profile is incomplete' }, { status: 400 });
    }
    if (currentUser.role !== 'Employee') {
      return NextResponse.json({ error: 'Only employees can view attendance status' }, { status: 403 });
    }

    if (empIdFromQuery && empIdFromQuery !== currentUser.employeeId) {
      return NextResponse.json({ error: 'Wrong QR for this user' }, { status: 403 });
    }

    const employeeId = empIdFromQuery || currentUser.employeeId;
    const today = format(new Date(), 'yyyy-MM-dd');

    const existing = await Attendance.findOne({
      user: currentUser._id,
      date: today
    });

    const activeSession = await AttendanceSession.findOne({
      companyId: currentUser.companyId,
      employeeId,
      userId: currentUser._id,
      status: 'ACTIVE',
    }).lean();

    const alreadyCompletedToday = !!existing?.checkOut;
    const checkInUrl = `${url.origin}/attendance/checkin?empId=${encodeURIComponent(employeeId)}`;

    return NextResponse.json({
      success: true,
      employeeId,
      present: !!existing,
      hasActiveSession: !!activeSession,
      alreadyCompletedToday,
      activeSession: activeSession
        ? {
            id: activeSession._id,
            checkInTime: activeSession.checkInTime,
            checkInLocation: activeSession.checkInLocation || null,
          }
        : null,
      checkInUrl,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
