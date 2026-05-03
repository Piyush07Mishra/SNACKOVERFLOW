import dbConnect from "@/lib/mongodb";
import { Attendance } from "@/lib/models/Attendance";
import { auth } from "@/auth";
import { AttendanceClient } from "./client";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

export default async function AttendancePage() {
  const session = await auth();
  const userId = session?.user?.id;
  const userRole = (session?.user as any)?.role;

  await dbConnect();
  
  const today = format(new Date(), "yyyy-MM-dd");
  let attendanceRecords = [];
  let todayRecord = null;

  const isAdminOrOfficer = ["Admin", "HR_Officer", "Payroll_Officer"].includes(userRole);

  // Show last 3 months of attendance data for all users
  const startDate = format(startOfMonth(subMonths(new Date(), 2)), "yyyy-MM-dd");
  const endDate = format(endOfMonth(new Date()), "yyyy-MM-dd");
  
  if (isAdminOrOfficer) {
    // Admin/Officers see attendance of all employees for last 3 months
    attendanceRecords = await Attendance.find({ 
      date: { $gte: startDate, $lte: endDate }
    })
      .populate("user", "name email employeeId")
      .sort({ date: -1, "user.name": 1 })
      .lean();
  } else {
    // Employees see their attendance for last 3 months
    attendanceRecords = await Attendance.find({ 
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    })
    .sort({ date: -1 })
    .lean();

    todayRecord = await Attendance.findOne({ user: userId, date: today }).lean();
  }

  const serializedRecords = attendanceRecords.map((record: any) => ({
    id: record._id.toString(),
    userName: record.user?.name || (isAdminOrOfficer ? "Unknown" : (session?.user?.name || "Self")),
    userEmail: record.user?.email || "",
    employeeId: record.employeeId || record.user?.employeeId || "",
    date: record.date,
    status: record.status,
    checkIn: record.checkIn ? format(new Date(record.checkIn), "hh:mm a") : "-",
    checkOut: record.checkOut ? format(new Date(record.checkOut), "hh:mm a") : "-",
    totalWorkingHours: record.totalWorkingHours ? record.totalWorkingHours.toFixed(2) : "0.00",
    breaks: record.breaks?.map((b: any) => ({
      start: b.start ? format(new Date(b.start), "hh:mm a") : "-",
      end: b.end ? format(new Date(b.end), "hh:mm a") : "-",
    })) || [],
    notes: record.notes || "",
  }));

  const serializedTodayRecord = todayRecord ? {
    id: todayRecord._id.toString(),
    status: todayRecord.status,
    checkIn: todayRecord.checkIn ? new Date(todayRecord.checkIn).toISOString() : null,
    checkOut: todayRecord.checkOut ? new Date(todayRecord.checkOut).toISOString() : null,
    isOnBreak: todayRecord.breaks?.some((b: any) => !b.end) || false,
    notes: todayRecord.notes || "",
    totalWorkingHours: todayRecord.totalWorkingHours || 0,
  } : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">
          {isAdminOrOfficer 
            ? "View employee attendance for the last 3 months." 
            : "Your attendance records for the last 3 months."}
        </p>
      </div>

      <AttendanceClient 
        records={serializedRecords} 
        todayRecord={serializedTodayRecord} 
        isEmployee={!isAdminOrOfficer} 
      />
    </div>
  );
}
