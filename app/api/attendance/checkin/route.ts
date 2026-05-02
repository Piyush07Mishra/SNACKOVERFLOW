import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Attendance } from '@/lib/models/Attendance';
import { auth } from '@/auth';
import { format } from 'date-fns';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const today = format(new Date(), 'yyyy-MM-dd');

    // Check if already checked in
    const existing = await Attendance.findOne({
      user: session.user.id,
      date: today
    });

    if (existing) {
      return NextResponse.json({ error: 'Already checked in today' }, { status: 400 });
    }

    await Attendance.create({
      user: session.user.id,
      date: today,
      status: 'Present',
      checkIn: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
