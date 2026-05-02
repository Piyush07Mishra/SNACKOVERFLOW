"use server";

import dbConnect from "@/lib/mongodb";
import { Attendance } from "@/lib/models/Attendance";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { format, differenceInMinutes } from "date-fns";

export async function checkIn() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  const today = format(new Date(), "yyyy-MM-dd");

  const existing = await Attendance.findOne({ user: session.user.id, date: today });
  if (existing) {
    throw new Error("Already checked in for today");
  }

  await Attendance.create({
    user: session.user.id,
    date: today,
    status: "Present",
    checkIn: new Date(),
  });

  revalidatePath("/dashboard/attendance");
}

export async function checkOut() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  const today = format(new Date(), "yyyy-MM-dd");

  const existing = await Attendance.findOne({ user: session.user.id, date: today });
  if (!existing) {
    throw new Error("No attendance record found for today");
  }
  if (existing.checkOut) {
    throw new Error("Already checked out for today");
  }

  const now = new Date();
  existing.checkOut = now;

  // Calculate total working hours (excluding breaks)
  let totalMinutes = differenceInMinutes(now, existing.checkIn);
  
  let breakMinutes = 0;
  if (existing.breaks && existing.breaks.length > 0) {
    existing.breaks.forEach((b: any) => {
      if (b.start && b.end) {
        breakMinutes += differenceInMinutes(b.end, b.start);
      } else if (b.start && !b.end) {
        // If still on break, end it now
        b.end = now;
        breakMinutes += differenceInMinutes(now, b.start);
      }
    });
  }

  existing.totalWorkingHours = (totalMinutes - breakMinutes) / 60;
  await existing.save();

  revalidatePath("/dashboard/attendance");
}

export async function startBreak() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  const today = format(new Date(), "yyyy-MM-dd");

  const existing = await Attendance.findOne({ user: session.user.id, date: today });
  if (!existing) throw new Error("Check in first");
  if (existing.checkOut) throw new Error("Already checked out");

  const activeBreak = existing.breaks.find((b: any) => !b.end);
  if (activeBreak) throw new Error("Already on break");

  existing.breaks.push({ start: new Date() });
  await existing.save();

  revalidatePath("/dashboard/attendance");
}

export async function endBreak() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  const today = format(new Date(), "yyyy-MM-dd");

  const existing = await Attendance.findOne({ user: session.user.id, date: today });
  if (!existing) throw new Error("Attendance record not found");

  const activeBreak = existing.breaks.find((b: any) => !b.end);
  if (!activeBreak) throw new Error("No active break found");

  activeBreak.end = new Date();
  await existing.save();

  revalidatePath("/dashboard/attendance");
}

export async function updateAttendanceNote(notes: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  const today = format(new Date(), "yyyy-MM-dd");

  const existing = await Attendance.findOne({ user: session.user.id, date: today });
  if (!existing) throw new Error("Attendance record not found");

  existing.notes = notes;
  await existing.save();

  revalidatePath("/dashboard/attendance");
}
