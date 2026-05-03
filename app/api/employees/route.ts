import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { Attendance } from '@/lib/models/Attendance';
import { Leave } from '@/lib/models/Leave';
import { Payroll } from '@/lib/models/Payroll';
import { format } from 'date-fns';

import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'HR_Officer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    await dbConnect();
    const today = format(new Date(), 'yyyy-MM-dd');
    const currentMonth = format(new Date(), 'yyyy-MM');

    // Get all users who are not Admin
    const users = await User.find({ role: { $ne: 'Admin' } }).sort({ name: 1 }).lean();
    
    // Get today's attendance, active leaves, and current month payrolls
    const [attendances, leaves, payrolls] = await Promise.all([
      Attendance.find({ date: today }).lean(),
      Leave.find({ 
        startDate: { $lte: new Date() }, 
        endDate: { $gte: new Date() },
        status: 'Approved' 
      }).lean(),
      Payroll.find({ month: currentMonth }).lean()
    ]);

    const employees = users.map((user: any) => {
      const attendance = attendances.find(a => a.user.toString() === user._id.toString());
      const leave = leaves.find(l => l.user.toString() === user._id.toString());
      const payroll = payrolls.find(p => p.user.toString() === user._id.toString());

      let status = 'absent';
      if (attendance && (attendance.status === 'Present' || attendance.status === 'Half_Day')) {
        status = 'present';
      } else if (leave) {
        status = 'leave';
      }

      
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.jobPosition,
        department: user.department,
        status,
        payroll: {
          netSalary: user.basicSalary || 0,
          status: payroll ? payroll.status : 'Base Salary'
        }
      };
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}
