"use server";

import dbConnect from "@/lib/mongodb";
import { Payroll } from "@/lib/models/Payroll";
import { User } from "@/lib/models/User";
import { Attendance } from "@/lib/models/Attendance";
import { Leave } from "@/lib/models/Leave";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDaysInMonth, parse, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay } from "date-fns";

export async function generatePayroll(month: string) {
  const session = await auth();
  if (!session || !["Admin", "Payroll_Officer"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  await dbConnect();

  const employees = await User.find({ role: { $ne: 'Admin' } });
  const targetDate = parse(month, "yyyy-MM", new Date());
  const totalDaysInMonth = getDaysInMonth(targetDate);
  const start = startOfMonth(targetDate);
  const end = endOfMonth(targetDate);

  for (const emp of employees) {
    const existing = await Payroll.findOne({ user: emp._id, month });
    if (existing) continue;

    // Fetch attendance for the month
    const attendanceRecords = await Attendance.find({
      user: emp._id,
      date: { $gte: format(start, "yyyy-MM-dd"), $lte: format(end, "yyyy-MM-dd") }
    });

    // Fetch approved leaves for the month
    const leaves = await Leave.find({
      user: emp._id,
      status: "Approved",
      $or: [
        { startDate: { $gte: start, $lte: end } },
        { endDate: { $gte: start, $lte: end } }
      ]
    });

    let payableDays = 0;
    let unpaidLeaves = 0;

    const days = eachDayOfInterval({ start, end });

    for (const day of days) {
      const dateStr = format(day, "yyyy-MM-dd");
      const attendance = attendanceRecords.find(r => r.date === dateStr);
      
      if (attendance) {
        if (attendance.status === "Present") {
          payableDays += 1;
        } else if (attendance.status === "Half_Day") {
          payableDays += 0.5;
        }
      } else {
        // No attendance record, check if it's an approved leave
        const leave = leaves.find(l => day >= l.startDate && day <= l.endDate);
        if (leave) {
          if (leave.type !== "Unpaid") {
            payableDays += 1;
          } else {
            unpaidLeaves += 1;
          }
        } else {
          // No attendance and no leave = unpaid/missing
          // Assuming weekends are not automatically paid if missing? 
          // Usually in corporate, weekends are paid if attendance is regular.
          // But as per "Any unpaid leave or missing attendance days should automatically reduce the number of payable days", 
          // we count only what is tracked.
          // unpaidLeaves += 1; 
        }
      }
    }

    const basicSalary = emp.basicSalary || 0;
    const proratedSalary = (basicSalary / totalDaysInMonth) * payableDays;
    
    const pfDeduction = proratedSalary * 0.12;
    const professionalTax = 200; // Flat PT

    const totalDeductions = pfDeduction + professionalTax;
    const netSalary = Math.max(0, proratedSalary - totalDeductions);

    await Payroll.create({
      user: emp._id,
      month,
      basicSalary: emp.basicSalary,
      payableDays,
      unpaidLeaves,
      pfDeduction,
      professionalTax,
      totalEarnings: proratedSalary,
      totalDeductions,
      netSalary,
      status: 'Processed'
    });
  }

  revalidatePath("/dashboard/payroll");
}

export async function processPayment(id: string) {
  const session = await auth();
  if (!session || !["Admin", "Payroll_Officer"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  await dbConnect();
  await Payroll.findByIdAndUpdate(id, { status: 'Paid' });
  revalidatePath("/dashboard/payroll");
}
