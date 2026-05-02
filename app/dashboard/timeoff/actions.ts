"use server";

import dbConnect from "@/lib/mongodb";
import { Leave } from "@/lib/models/Leave";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function applyForLeave(data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  await Leave.create({
    user: session.user.id,
    type: data.type,
    startDate: data.startDate,
    endDate: data.endDate,
    reason: data.reason,
  });

  revalidatePath("/dashboard/timeoff");
}

export async function updateLeaveStatus(id: string, status: "Approved" | "Rejected") {
  const session = await auth();
  if (!session?.user || !["Admin", "Payroll_Officer"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  await dbConnect();
  
  await Leave.findByIdAndUpdate(id, {
    status,
    approvedBy: session.user.id,
  });

  revalidatePath("/dashboard/timeoff");
}
