"use server";

import dbConnect from "@/lib/mongodb";
import { Attendance } from "@/lib/models/Attendance";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { format, differenceInMinutes } from "date-fns";
import { attendanceNoteSchema, sanitizeInput, createSuccessResponse } from "@/lib/security";
import logger from "@/lib/logger";

export async function checkIn() {
  const session = await auth();
  if (!session?.user?.id) {
    logger.security("Unauthorized check-in attempt", session?.user?.id || 'unknown', undefined, "checkin");
    throw new Error("Unauthorized");
  }

  try {
    await dbConnect();
    const today = format(new Date(), "yyyy-MM-dd");

    const existing = await Attendance.findOne({ user: session.user.id, date: today });
    if (existing) {
      logger.warn("Duplicate check-in attempt", session.user.id, undefined, "checkin", {
        date: today,
        existingRecordId: existing._id
      });
      throw new Error("Already checked in for today");
    }

    const attendance = await Attendance.create({
      user: session.user.id,
      date: today,
      status: "Present",
      checkIn: new Date(),
      timerStartTime: new Date(),
    });

    logger.db("create", "attendance", session.user.id, { date: today, status: "Present" }, attendance);
    
    revalidatePath("/dashboard/attendance");
    return createSuccessResponse({ message: "Checked in successfully" });

  } catch (error: any) {
    logger.error("Check-in failed", session.user?.id, undefined, "checkin", error);
    throw error;
  }
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
  if (!session?.user?.id) {
    logger.security("Unauthorized note update attempt", session?.user?.id || 'unknown', undefined, "updateNote");
    throw new Error("Unauthorized");
  }

  try {
    // Input validation
    const validation = attendanceNoteSchema.safeParse({ notes });
    if (!validation.success) {
      const errorMessages = validation.error.issues.map((err: any) => err.message).join(', ');
      logger.warn("Invalid note data", session.user.id, undefined, "updateNote", {
        validationErrors: errorMessages
      });
      throw new Error(`Validation failed: ${errorMessages}`);
    }

    await dbConnect();
    const today = format(new Date(), "yyyy-MM-dd");

    const existing = await Attendance.findOne({ user: session.user.id, date: today });
    if (!existing) {
      logger.warn("Note update on non-existent attendance", session.user.id, undefined, "updateNote", {
        date: today
      });
      throw new Error("Attendance record not found");
    }

    const sanitizedNotes = sanitizeInput(notes);
    existing.notes = sanitizedNotes;
    await existing.save();

    logger.db("update", "attendance", session.user.id, { date: today, notesUpdated: true }, existing);
    
    revalidatePath("/dashboard/attendance");
    return createSuccessResponse({ message: "Note updated successfully" });

  } catch (error: any) {
    logger.error("Note update failed", session.user.id, undefined, "updateNote", error);
    throw error;
  }
}
