"use server";

import dbConnect from "@/lib/mongodb";
import { Payroll } from "@/lib/models/Payroll";
import { User } from "@/lib/models/User";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function generatePayroll(month: string) {
  const session = await auth();
  if (!session || !["Admin", "Payroll_Officer"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  await dbConnect();

  const employees = await User.find({ role: { $ne: 'Admin' } });

  for (const emp of employees) {
    const existing = await Payroll.findOne({ user: emp._id, month });
    if (!existing) {
      const basicSalary = emp.basicSalary || 0;
      const pfDeduction = basicSalary * 0.12;
      const professionalTax = 200; // Flat PT

      const totalDeductions = pfDeduction + professionalTax;
      const netSalary = basicSalary - totalDeductions;

      await Payroll.create({
        user: emp._id,
        month,
        basicSalary,
        pfDeduction,
        professionalTax,
        totalEarnings: basicSalary,
        totalDeductions,
        netSalary,
        status: 'Processed'
      });
    }
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
