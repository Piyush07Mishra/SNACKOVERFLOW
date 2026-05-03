import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, CalendarOff, Banknote } from "lucide-react";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Attendance } from "@/lib/models/Attendance";
import { Leave } from "@/lib/models/Leave";
import { Payroll } from "@/lib/models/Payroll";
import { format } from "date-fns";
import { EmployeeGrid } from "@/components/EmployeeGrid";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";

import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'HR_Officer') {
    // If not admin or hr, they might have their own dashboard or we redirect
    // For now, if it's an employee, we might want to redirect to their profile or attendance
    // But since the request is "show THIS dashboard to only admin/hr", 
    // I will show an access denied or redirect.
    // Let's redirect to attendance for now as a default for employees.
    redirect("/dashboard/attendance");
  }

  await dbConnect();
  
  const today = format(new Date(), "yyyy-MM-dd");
  const currentMonth = format(new Date(), "yyyy-MM");

  const [totalEmployees, presentToday, pendingLeaves, pendingPayroll] = await Promise.all([
    User.countDocuments({ role: { $ne: 'Admin' } }),
    Attendance.countDocuments({ date: today, status: { $in: ['Present', 'Half_Day'] } }),
    Leave.countDocuments({ status: 'Pending' }),
    Payroll.countDocuments({ month: currentMonth, status: 'Pending' }),
  ]);

  return (
    <div className="space-y-8">
      {/* PWA Install Banner */}
      <PWAInstallBanner />
      
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome to EmPay HRMS. Here's what's happening today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active workforce</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presentToday}</div>
            <p className="text-xs text-muted-foreground">Employees checked in</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
            <CalendarOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingLeaves}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payrolls</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayroll}</div>
            <p className="text-xs text-muted-foreground">For current month</p>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4 border-t border-border/50">
        <EmployeeGrid />
      </div>
    </div>
  );
}
