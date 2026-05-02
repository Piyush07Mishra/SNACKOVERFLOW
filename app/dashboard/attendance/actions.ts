"use server";

import dbConnect from "@/lib/mongodb";
import { Attendance } from "@/lib/models/Attendance";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { format } from "date-fns";

export async function markAttendance(status: "Present" | "Half_Day" | "Absent") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  const today = format(new Date(), "yyyy-MM-dd");

  const existing = await Attendance.findOne({ user: session.user.id, date: today });
  
  if (existing) {
    throw new Error("Attendance already marked for today");
  }

  await Attendance.create({
    user: session.user.id,
    date: today,
    status,
    checkIn: new Date(),
  });

  revalidatePath("/dashboard/attendance");
}
