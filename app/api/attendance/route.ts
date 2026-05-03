import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Attendance } from '@/lib/models/Attendance';
import { auth } from '@/auth';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const employeeId = searchParams.get('employeeId');
    
    // Determine date range
    let startDate, endDate;
    
    if (month) {
      // Use specified month
      const date = new Date(month + '-01');
      startDate = startOfMonth(date);
      endDate = endOfMonth(date);
    } else {
      // Default to last 3 months
      endDate = new Date();
      startDate = startOfMonth(subMonths(endDate, 2));
    }
    
    // Build query
    const query: any = {
      date: {
        $gte: format(startDate, 'yyyy-MM-dd'),
        $lte: format(endDate, 'yyyy-MM-dd')
      }
    };
    
    // Filter by user if not admin
    const userRole = (session.user as any).role;
    if (userRole !== 'Admin' && userRole !== 'Payroll_Officer') {
      query.user = session.user.id;
    } else if (employeeId) {
      // Admin can filter by specific employee
      query.user = employeeId;
    }
    
    // Fetch attendance records
    const records = await Attendance.find(query)
      .populate('user', 'name email employeeId')
      .sort({ date: -1 });
    
    // Format records for frontend
    const formattedRecords = records.map(record => ({
      id: record._id.toString(),
      date: record.date,
      status: record.status,
      checkIn: record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }) : null,
      checkOut: record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }) : null,
      totalWorkingHours: record.totalWorkingHours || 0,
      breaks: record.breaks || [],
      notes: record.notes || '',
      userName: (record.user as any)?.name || 'Unknown',
      userEmail: (record.user as any)?.email || '',
      employeeId: (record.user as any)?.employeeId || '',
      employeeId_field: record.employeeId || ''
    }));
    
    return NextResponse.json(formattedRecords);
    
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
