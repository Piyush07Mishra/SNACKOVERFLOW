import dbConnect from "@/lib/mongodb";
import { Payroll } from "@/lib/models/Payroll";
import { auth } from "@/auth";
import { PayrollClient } from "./client";
import { format } from "date-fns";

export default async function PayrollPage() {
  const session = await auth();
  const userRole = (session?.user as any)?.role;

  if (!["Admin", "Payroll_Officer"].includes(userRole)) {
    return <div>Unauthorized. You don't have access to this page.</div>;
  }

  await dbConnect();
  
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
