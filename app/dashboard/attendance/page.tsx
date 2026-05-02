import dbConnect from "@/lib/mongodb";
import { Attendance } from "@/lib/models/Attendance";
import { auth } from "@/auth";
import { AttendanceClient } from "./client";
import { format } from "date-fns";

export default async function AttendancePage() {
  const session = await auth();
  const userId = session?.user?.id;
  const userRole = (session?.user as any)?.role;

  await dbConnect();
  
  const today = format(new Date(), "yyyy-MM-dd");
  let attendanceRecords = [];
  let todayStatus = null;

  if (["Admin", "HR_Officer", "Payroll_Officer"].includes(userRole)) {
    // Admin, HR, Payroll can see all attendance
    attendanceRecords = await Attendance.find({}).sort({ date: -1 }).populate("user", "name email").lean();
  } else {
    // Employees see only their attendance
    attendanceRecords = await Attendance.find({ user: userId }).sort({ date: -1 }).populate("user", "name email").lean();
    const todayRecord = await Attendance.findOne({ user: userId, date: today }).lean();
    if (todayRecord) {
      todayStatus = todayRecord.status;
    }
  }

  const serializedRecords = attendanceRecords.map((record: any) => ({
    id: record._id.toString(),
    userName: record.user?.name || "Unknown",
    userEmail: record.user?.email || "Unknown",
    date: record.date,
    status: record.status,
    checkIn: record.checkIn ? new Date(record.checkIn).toLocaleString() : "-",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
        <p className="text-muted-foreground">Mark and view attendance logs.</p>
      </div>

      <AttendanceClient 
        records={serializedRecords} 
        todayStatus={todayStatus} 
        isEmployee={userRole === "Employee"} 
      />
    </div>
  );
}
