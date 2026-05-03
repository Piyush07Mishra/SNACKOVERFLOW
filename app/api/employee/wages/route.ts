import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { Attendance } from '@/lib/models/Attendance';
import { Leave } from '@/lib/models/Leave';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parse } from 'date-fns';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month');

    if (!employeeId || !month) {
      return NextResponse.json({ error: 'Employee ID and month are required' }, { status: 400 });
    }

    await dbConnect();

    const currentUser = await User.findById(session.user.id);
    if (!currentUser?.companyId) {
      return NextResponse.json({ error: 'User company not found' }, { status: 400 });
    }

    // Get employee details
    const employee = await User.findOne({ _id: employeeId, companyId: currentUser.companyId });
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const sessionRole = (session?.user as any)?.role;
    const canViewOtherEmployee = ['Admin', 'Payroll_Officer', 'HR_Officer'].includes(sessionRole);
    if (employee._id.toString() !== session.user.id && !canViewOtherEmployee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse month and get date range
    const targetDate = parse(month, 'yyyy-MM', new Date());
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Fetch attendance records for the month
    const attendanceRecords = await Attendance.find({
      user: employeeId,
      companyId: currentUser.companyId,
      date: { $gte: format(monthStart, 'yyyy-MM-dd'), $lte: format(monthEnd, 'yyyy-MM-dd') }
    }).lean();

    // Fetch approved leaves for the month
    const leaves = await Leave.find({
      user: employeeId,
      companyId: currentUser.companyId,
      status: 'Approved',
      $or: [
        { startDate: { $gte: monthStart, $lte: monthEnd } },
        { endDate: { $gte: monthStart, $lte: monthEnd } }
      ]
    }).lean();

    const dailyRecords = [];

    for (const day of monthDays) {
      const dateStr = format(day, 'yyyy-MM-dd');
      const attendance = attendanceRecords.find(r => r.date === dateStr);
      
      // Check if it's a leave day
      const leave = leaves.find(l => day >= l.startDate && day <= l.endDate);
      
      let status: 'Present' | 'Half_Day' | 'Absent' | 'Leave' = 'Absent';
      let totalWorkingHours = 0;
      let checkIn, checkOut, breaks;

      if (attendance) {
        status = attendance.status as any;
        totalWorkingHours = attendance.totalWorkingHours || 0;
        checkIn = attendance.checkIn;
        checkOut = attendance.checkOut;
        breaks = attendance.breaks || [];
      } else if (leave) {
        status = 'Leave';
        totalWorkingHours = leave.type !== 'Unpaid' ? 8 : 0; // Full day for paid leave
      }

      // Calculate daily wage
      const basicSalary = employee.basicSalary || 0;
      const dailyWage = basicSalary / 22; // Assuming 22 working days
      const hourlyWage = dailyWage / 8;
      
      let wage = 0;
      if (status === 'Present') {
        wage = Math.round(totalWorkingHours * hourlyWage);
      } else if (status === 'Half_Day') {
        wage = Math.round(dailyWage * 0.5);
      } else if (status === 'Leave' && leave && leave.type !== 'Unpaid') {
        wage = Math.round(dailyWage);
      }

      dailyRecords.push({
        date: dateStr,
        checkIn,
        checkOut,
        totalWorkingHours,
        breaks: breaks || [],
        status,
        wage
      });
    }

    return NextResponse.json(dailyRecords);
  } catch (error) {
    console.error('Wages API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
