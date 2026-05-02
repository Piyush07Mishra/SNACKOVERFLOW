import dbConnect from "@/lib/mongodb";
import { Payroll } from "@/lib/models/Payroll";
import { User } from "@/lib/models/User";
import { auth } from "@/auth";
import { PayrollClient } from "./client";
import { PayrollEmployeeClient } from "./employee-client";
import { format } from "date-fns";

export default async function PayrollPage() {
  const session = await auth();
  const userRole = (session?.user as any)?.role;
  const userEmail = session?.user?.email;

  await dbConnect();

  // Admin/Payroll Officer view - see all payroll records
  if (["Admin", "Payroll_Officer"].includes(userRole)) {
    const currentMonth = format(new Date(), "yyyy-MM");
    const payrollRecords = await Payroll.find({ month: currentMonth }).populate("user", "name email").lean();

    const serializedRecords = payrollRecords.map((rec: any) => ({
      id: rec._id.toString(),
      userName: rec.user?.name || "Unknown",
      month: rec.month,
      basicSalary: rec.basicSalary,
      payableDays: rec.payableDays,
      unpaidLeaves: rec.unpaidLeaves,
      pfDeduction: rec.pfDeduction,
      professionalTax: rec.professionalTax,
      totalEarnings: rec.totalEarnings,
      totalDeductions: rec.totalDeductions,
      netSalary: rec.netSalary,
      status: rec.status,
    }));

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
            <p className="text-muted-foreground">Manage and process employee salaries for {currentMonth}.</p>
          </div>
        </div>

        <PayrollClient records={serializedRecords} currentMonth={currentMonth} />
      </div>
    );
  }

  // Employee view - see their own payroll records
  const currentUser = await User.findOne({ email: userEmail }).lean();
  const employeePayrollRecords = await Payroll.find({ user: currentUser?._id }).sort({ month: -1 }).lean();

  const serializedEmployeeRecords = employeePayrollRecords.map((rec: any) => ({
    id: rec._id.toString(),
    month: rec.month,
    basicSalary: rec.basicSalary,
    payableDays: rec.payableDays,
    unpaidLeaves: rec.unpaidLeaves,
    pfDeduction: rec.pfDeduction,
    professionalTax: rec.professionalTax,
    totalEarnings: rec.totalEarnings,
    totalDeductions: rec.totalDeductions,
    netSalary: rec.netSalary,
    status: rec.status,
    createdAt: rec.createdAt,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Payroll</h1>
          <p className="text-muted-foreground">View your detailed payroll records and payslips.</p>
        </div>
      </div>

      <PayrollEmployeeClient records={serializedEmployeeRecords} employeeName={currentUser?.name || "Employee"} />
    </div>
  );
}
