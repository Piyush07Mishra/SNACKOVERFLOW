"use server";

import dbConnect from "@/lib/mongodb";
import { Leave } from "@/lib/models/Leave";
import { User } from "@/lib/models/User";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { emailService } from "@/lib/customEmailService";
import { emailConfigManager } from "@/lib/emailConfig";

export async function applyForLeave(data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await dbConnect();
  
  // Create the leave request
  const leave = await Leave.create({
    user: session.user.id,
    type: data.type,
    startDate: data.startDate,
    endDate: data.endDate,
    reason: data.reason,
  });

  // Leave request emails disabled - only leave approval emails are sent

  revalidatePath("/dashboard/timeoff");
}

export async function updateLeaveStatus(id: string, status: "Approved" | "Rejected") {
  const session = await auth();
  if (!session?.user || !["Admin", "Payroll_Officer"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  await dbConnect();
  
  // Get the leave details before updating
  const leave = await Leave.findById(id);
  if (!leave) {
    throw new Error("Leave request not found");
  }

  // Update the leave status
  const updatedLeave = await Leave.findByIdAndUpdate(id, {
    status,
    approvedBy: session.user.id,
  }, { new: true });

  // Send email notification to employee if enabled
  console.log('🔍 Checking if leave approval email is enabled...');
  console.log('Email settings:', emailConfigManager.getSettings().notifications);
  
  if (emailConfigManager.isNotificationEnabled('leaveApproval')) {
    console.log('✅ Leave approval email is enabled, attempting to send...');
    try {
      // Get employee and approver details
      const employee = await User.findById(leave.user);
      const approver = await User.findById(session.user.id);

      console.log('👤 Employee found:', !!employee);
      console.log('👤 Approver found:', !!approver);
      
      if (employee) {
        console.log('📧 Employee email:', employee.email);
      }
      if (approver) {
        console.log('👨‍💼 Approver name:', approver.name);
      }

      if (!employee || !approver) {
        console.error('❌ Employee or approver not found for email notification');
        return;
      }

      console.log('📧 Sending leave approval email...');
      // Send approval/rejection email
      const emailResult = await emailService.sendLeaveApprovalEmail(
        employee, 
        updatedLeave, 
        approver, 
        status === 'Approved'
      );

      console.log('✅ Leave approval email result:', emailResult);
      console.log(`✅ Leave ${status.toLowerCase()} email sent to ${employee.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send leave approval email:', emailError);
      // Don't throw error - leave update should still work even if email fails
    }
  } else {
    console.log('❌ Leave approval email is disabled in settings');
  }

  revalidatePath("/dashboard/timeoff");
}
