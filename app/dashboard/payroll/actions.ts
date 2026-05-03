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

  const generatedPayrolls = [];

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
    let totalWorkingHours = 0;
    let overtimeHours = 0;

    const days = eachDayOfInterval({ start, end });

    for (const day of days) {
      const dateStr = format(day, "yyyy-MM-dd");
      const attendance = attendanceRecords.find(r => r.date === dateStr);
      
      if (attendance) {
        // Add working hours from attendance
        if (attendance.totalWorkingHours) {
          totalWorkingHours += attendance.totalWorkingHours;
          
          // Calculate overtime (assuming 8 hours is standard work day)
          const dayHours = attendance.totalWorkingHours;
          if (dayHours > 8) {
            overtimeHours += (dayHours - 8);
          }
        }
        
        if (attendance.status === "Present") {
          payableDays += 1;
        } else if (attendance.status === "Half_Day") {
          payableDays += 0.5;
        } else if (attendance.status === "Leave") {
          // Leave is already handled in the leaves check below
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
          // Count weekends/holidays differently if needed
          const dayOfWeek = day.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not weekend
            unpaidLeaves += 1;
          }
        }
      }
    }

    const basicSalary = Number(emp.basicSalary) || 0;
    
    // Validate inputs to prevent NaN
    if (basicSalary <= 0 || totalDaysInMonth <= 0) {
      console.warn(`Invalid salary data for employee ${emp.name}: basicSalary=${basicSalary}, totalDaysInMonth=${totalDaysInMonth}`);
      // Create payroll with zero values for employees with invalid salary
      await Payroll.create({
        user: emp._id,
        month,
        basicSalary: 0,
        payableDays,
        unpaidLeaves,
        totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
        overtimePay: 0,
        pfDeduction: 0,
        professionalTax: 0,
        totalEarnings: 0,
        totalDeductions: 0,
        netSalary: 0,
        status: 'Processed'
      });
      continue;
    }
    
    const proratedSalary = (basicSalary / totalDaysInMonth) * payableDays;
    
    // Calculate overtime pay (1.5x hourly rate for overtime)
    const hourlyRate = basicSalary / (totalDaysInMonth * 8); // Assuming 8-hour work days
    const overtimePay = overtimeHours * hourlyRate * 1.5;
    
    const totalEarnings = proratedSalary + overtimePay;
    
    const pfDeduction = totalEarnings * 0.12;
    const professionalTax = 200; // Flat PT

    const totalDeductions = pfDeduction + professionalTax;
    const netSalary = Math.max(0, totalEarnings - totalDeductions);

    const payroll = await Payroll.create({
      user: emp._id,
      month,
      basicSalary: emp.basicSalary,
      payableDays,
      unpaidLeaves,
      totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      overtimePay: Math.round(overtimePay * 100) / 100,
      pfDeduction: Math.round(pfDeduction * 100) / 100,
      professionalTax,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      netSalary: Math.round(netSalary * 100) / 100,
      status: 'Processed'
    });

    generatedPayrolls.push({ employee: emp, payroll });
  }

  // Payroll emails disabled - only leave approval emails are sent
  console.log(`Payroll generated for ${generatedPayrolls.length} employees`);

  revalidatePath("/dashboard/payroll");
}

// Payroll email functions removed - only leave approval emails are sent

export async function processPayment(id: string) {
  const session = await auth();
  if (!session || !["Admin", "Payroll_Officer"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  await dbConnect();
  await Payroll.findByIdAndUpdate(id, { status: 'Paid' });
  revalidatePath("/dashboard/payroll");
}
