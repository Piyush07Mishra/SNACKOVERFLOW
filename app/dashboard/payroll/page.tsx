import dbConnect from "@/lib/mongodb";
import { Payroll } from "@/lib/models/Payroll";
import { User } from "@/lib/models/User";
import { Attendance } from "@/lib/models/Attendance";
import { Leave } from "@/lib/models/Leave";
import { auth } from "@/auth";
import { PayrollClient } from "./client";
import { PayrollEmployeeClient } from "./employee-client";
import { format } from "date-fns";

export default async function PayrollPage() {
  const session = await auth();
  const userRole = (session?.user as any)?.role;
  const userEmail = session?.user?.email;

  await dbConnect();

  const sessionUser = await User.findById(session?.user?.id).lean();
  if (!sessionUser || !sessionUser.companyId) {
    throw new Error("Could not determine current user's company. Please contact administrator.");
  }

  // Admin/Payroll Officer view - see all employees
  if (["Admin", "Payroll_Officer"].includes(userRole)) {
    const currentMonth = format(new Date(), "yyyy-MM");
    
    // Fetch all employees for this company (excluding Admins)
    const employees = await User.find({ role: { $ne: 'Admin' }, companyId: sessionUser.companyId }).lean();
    
    // Fetch payroll records for current month scoped to the same company
    const payrollRecords = await Payroll.find({ month: currentMonth, companyId: sessionUser.companyId }).lean();
    
    // Create a map for quick payroll lookup
    const payrollMap = new Map(
      payrollRecords.map((rec: any) => [rec.user.toString(), rec])
    );

    const serializedEmployees = employees.map((emp: any) => {
      const payroll = payrollMap.get(emp._id.toString());
      return {
        id: emp._id.toString(),
        name: emp.name,
        email: emp.email,
        role: emp.role,
        designation: emp.designation,
        department: emp.department,
        basicSalary: emp.basicSalary || 0,
        payroll: payroll ? {
          id: payroll._id.toString(),
          month: payroll.month,
          payableDays: payroll.payableDays,
          unpaidLeaves: payroll.unpaidLeaves,
          pfDeduction: payroll.pfDeduction,
          professionalTax: payroll.professionalTax,
          totalEarnings: payroll.totalEarnings,
          totalDeductions: payroll.totalDeductions,
          netSalary: payroll.netSalary,
          status: payroll.status,
        } : null,
      };
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
            <p className="text-muted-foreground">Manage and process employee salaries for {currentMonth}.</p>
          </div>
        </div>

        <PayrollClient employees={serializedEmployees} currentMonth={currentMonth} />
      </div>
    );
  }

  // Employee view - see their own payroll records
  const currentUser = await User.findById(session?.user?.id).lean();
  const employeePayrollRecords = await Payroll.find({
    user: currentUser?._id,
    companyId: sessionUser.companyId,
  }).sort({ month: -1 }).lean();

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
