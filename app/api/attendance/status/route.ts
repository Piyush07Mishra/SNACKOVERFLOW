import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Attendance } from '@/lib/models/Attendance';
import { auth } from '@/auth';
import { format } from 'date-fns';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const today = format(new Date(), 'yyyy-MM-dd');

    const existing = await Attendance.findOne({
      user: session.user.id,
      date: today
    });

    return NextResponse.json({ present: !!existing });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
