import dbConnect from "@/lib/mongodb";
import { Attendance } from "@/lib/models/Attendance";
import { AttendanceSession } from "@/lib/models/AttendanceSession";
import { User } from "@/lib/models/User";
import { auth } from "@/auth";
import { AttendanceClient } from "./client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import QRCode from "qrcode";

export default async function AttendancePage() {
  const session = await auth();
  const userId = session?.user?.id;
  const userRole = (session?.user as any)?.role;

  await dbConnect();
  
  const today = format(new Date(), "yyyy-MM-dd");
  let attendanceRecords = [];
  let todayRecord = null;
  let checkInUrl: string | null = null;
  let qrDataUrl: string | null = null;
  let hasActiveSession = false;

  const isAdminOrOfficer = ["Admin", "HR_Officer", "Payroll_Officer"].includes(userRole);

  if (!isAdminOrOfficer && userId) {
    const currentUser = await User.findById(userId).select("employeeId companyId").lean();
    const employeeId = currentUser?.employeeId || "";
    if (employeeId) {
      checkInUrl = `/attendance/checkin?empId=${encodeURIComponent(employeeId)}`;
      const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";
      qrDataUrl = await QRCode.toDataURL(`${origin}${checkInUrl}`);
      hasActiveSession = !!(await AttendanceSession.findOne({
        companyId: currentUser.companyId,
        employeeId,
        status: 'ACTIVE',
      }).lean());
    }
  }

  if (isAdminOrOfficer) {
    // Admin/Officers see a full attendance list of all company employees for today.
    const companyId = (session?.user as any)?.companyId;
    const employees = await User.find({ companyId, role: { $ne: 'Admin' } })
      .select('name email employeeId')
      .lean();

    const todayAttendance = await Attendance.find({ date: today, companyId })
      .select('user status checkIn checkOut totalWorkingHours breaks notes employeeId')
      .lean();

    const attendanceByUser = new Map(todayAttendance.map((record: any) => [record.user.toString(), record]));

    attendanceRecords = employees.map((employee) => {
      const attendance = attendanceByUser.get(employee._id.toString());
      return {
        _id: attendance?._id || employee._id,
        user: employee,
        employeeId: employee.employeeId,
        date: today,
        status: attendance?.status || 'Absent',
        checkIn: attendance?.checkIn || null,
        checkOut: attendance?.checkOut || null,
        totalWorkingHours: attendance?.totalWorkingHours || 0,
        breaks: attendance?.breaks || [],
        notes: attendance?.notes || '',
      };
    });
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
            ? "View employee attendance for today." 
            : "Your attendance records for this month."}
        </p>
      </div>

      <AttendanceClient 
        records={serializedRecords} 
        todayRecord={serializedTodayRecord} 
        isEmployee={!isAdminOrOfficer} 
        checkInUrl={checkInUrl}
        qrDataUrl={qrDataUrl}
        hasActiveSession={hasActiveSession}
      />
    </div>
  );
}
