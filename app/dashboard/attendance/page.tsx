import dbConnect from "@/lib/mongodb";
import { Attendance } from "@/lib/models/Attendance";
import { auth } from "@/auth";
import { AttendanceClient } from "./client";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default async function AttendancePage() {
  const session = await auth();
  const userId = session?.user?.id;
  const userRole = (session?.user as any)?.role;

  await dbConnect();
  
  const today = format(new Date(), "yyyy-MM-dd");
  let attendanceRecords = [];
  let todayRecord = null;

  const isAdminOrOfficer = ["Admin", "HR_Officer", "Payroll_Officer"].includes(userRole);

  if (isAdminOrOfficer) {
    // Admin/Officers see attendance of all employees present on current day
    attendanceRecords = await Attendance.find({ date: today })
      .populate("user", "name email employeeId")
      .lean();
  } else {
    // Employees see day-wise attendance of themselves for ongoing month
    const start = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const end = format(endOfMonth(new Date()), "yyyy-MM-dd");
    
    attendanceRecords = await Attendance.find({ 
      user: userId,
      date: { $gte: start, $lte: end }
    })
    .sort({ date: -1 })
    .lean();

    todayRecord = await Attendance.findOne({ user: userId, date: today }).lean();
  }

  const serializedRecords = attendanceRecords.map((record: any) => ({
    id: record._id.toString(),
    userName: record.user?.name || (isAdminOrOfficer ? "Unknown" : (session?.user?.name || "Self")),
    userEmail: record.user?.email || "",
    date: record.date,
    status: record.status,
    checkIn: record.checkIn ? format(new Date(record.checkIn), "hh:mm a") : "-",
    checkOut: record.checkOut ? format(new Date(record.checkOut), "hh:mm a") : "-",
    totalWorkingHours: record.totalWorkingHours ? record.totalWorkingHours.toFixed(2) : "0.00",
    breaks: record.breaks?.map((b: any) => ({
      start: b.start ? format(new Date(b.start), "hh:mm a") : "-",
      end: b.end ? format(new Date(b.end), "hh:mm a") : "-",
    })) || [],
  }));

  const serializedTodayRecord = todayRecord ? {
    id: todayRecord._id.toString(),
    status: todayRecord.status,
    checkIn: todayRecord.checkIn ? new Date(todayRecord.checkIn).toISOString() : null,
    checkOut: todayRecord.checkOut ? new Date(todayRecord.checkOut).toISOString() : null,
    isOnBreak: todayRecord.breaks?.some((b: any) => !b.end) || false,
  } : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">
          {isAdminOrOfficer 
            ? "View employee attendance for today." 
            : "Your attendance records for this month."}
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
