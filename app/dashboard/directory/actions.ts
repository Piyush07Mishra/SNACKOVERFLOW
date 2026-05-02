"use server";

import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";

export async function createEmployee(data: any) {
  const session = await auth();
  if (!session || !["Admin", "HR_Officer"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  await dbConnect();
  const hashedPassword = await bcrypt.hash("password123", 10);

  await User.create({
    ...data,
    password: hashedPassword,
  });

  revalidatePath("/dashboard/directory");
}

export async function updateEmployee(id: string, data: any) {
  const session = await auth();
  if (!session || !["Admin", "HR_Officer"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  await dbConnect();
  await User.findByIdAndUpdate(id, data);
  
  revalidatePath("/dashboard/directory");
}

export async function deleteEmployee(id: string) {
  const session = await auth();
  if (!session?.user || session.user.id === id || !["Admin", "HR_Officer"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  try {
    await dbConnect();
    const targetUserId = id;

    // Validate target user ID
    if (!targetUserId || targetUserId === session.user.id) {
      throw new Error("Invalid user ID or cannot delete yourself");
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Prevent deletion of admins (only super admins can delete admins)
    if (targetUser.role === 'Admin' && (session.user as any)?.role !== 'Admin') {
      throw new Error("Cannot delete admin users");
    }

    // Start transaction-like cleanup
    let deletedAttendance = 0;
    let deletedPayroll = 0;
    let deletedLeave = 0;

    // Import models here to avoid circular dependencies
    const { Attendance } = await import('@/lib/models/Attendance');
    const { Payroll } = await import('@/lib/models/Payroll');
    const { Leave } = await import('@/lib/models/Leave');

    // Delete attendance records
    const attendanceDelete = await Attendance.deleteMany({ user: targetUserId });
    deletedAttendance = attendanceDelete.deletedCount || 0;

    // Delete payroll records
    const payrollDelete = await Payroll.deleteMany({ user: targetUserId });
    deletedPayroll = payrollDelete.deletedCount || 0;

    // Delete leave records
    const leaveDelete = await Leave.deleteMany({ user: targetUserId });
    deletedLeave = leaveDelete.deletedCount || 0;

    // Finally delete the user
    const deletedUser = await User.findByIdAndDelete(targetUserId);

    console.log('Member deletion completed', {
      deletedUser: {
        id: targetUserId,
        email: deletedUser?.email,
        name: deletedUser?.name,
        role: deletedUser?.role
      },
      deletedRecords: {
        attendance: deletedAttendance,
        payroll: deletedPayroll,
        leave: deletedLeave
      },
      deletedBy: session.user.id
    });
    
    revalidatePath("/dashboard/directory");
    return {
      message: "Member deleted successfully",
      deletedUser: {
        id: targetUserId,
        email: deletedUser?.email,
        name: deletedUser?.name,
        role: deletedUser?.role
      },
      deletedRecords: {
        attendance: deletedAttendance,
        payroll: deletedPayroll,
        leave: deletedLeave
      }
    };

  } catch (error: any) {
    console.error('Delete employee error:', error);
    throw new Error(error.message || 'Failed to delete employee');
  }
}
