import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { Attendance } from '@/lib/models/Attendance';
import { Payroll } from '@/lib/models/Payroll';
import { Leave } from '@/lib/models/Leave';
import { auth } from '@/auth';
import { rateLimit, setSecurityHeaders, createErrorResponse, createSuccessResponse } from '@/lib/security';
import logger from '@/lib/logger';

// Get client IP for rate limiting
function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

// Check if user has admin permissions
function hasAdminPermissions(role: string): boolean {
  return ['Admin', 'HR_Officer'].includes(role);
}

export async function DELETE(
  req: Request,
  { params }: { params: { userId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    const response = createErrorResponse('Unauthorized', 401);
    return setSecurityHeaders(response);
  }

  // Check admin permissions
  if (!hasAdminPermissions((session.user as any)?.role || '')) {
    logger.security('Unauthorized member deletion attempt', session.user.id, getClientIP(req), 'delete-member', {
      targetUserId: params.userId,
      userRole: (session.user as any)?.role
    });
    const response = createErrorResponse('Insufficient permissions', 403);
    return setSecurityHeaders(response);
  }

  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    if (!rateLimit(`delete-member:${session.user.id}`, 3, 60 * 60 * 1000)) { // 3 deletions per hour
      const response = createErrorResponse('Too many deletion attempts. Please try again later.', 429);
      return setSecurityHeaders(response);
    }

    await dbConnect();
    const targetUserId = params.userId;

    // Validate target user ID
    if (!targetUserId || targetUserId === session.user.id) {
      const response = createErrorResponse('Invalid user ID or cannot delete yourself', 400);
      return setSecurityHeaders(response);
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      const response = createErrorResponse('User not found', 404);
      return setSecurityHeaders(response);
    }

    // Prevent deletion of admins (only super admins can delete admins)
    if (targetUser.role === 'Admin' && (session.user as any)?.role !== 'Admin') {
      logger.security('Attempt to delete admin by non-admin', session.user.id, getClientIP(req), 'delete-member', {
        targetUserId: targetUserId,
        targetRole: targetUser.role,
        userRole: (session.user as any)?.role
      });
      const response = createErrorResponse('Cannot delete admin users', 403);
      return setSecurityHeaders(response);
    }

    // Start transaction-like cleanup
    const deleteResults: {
      user: any;
      attendance: number;
      payroll: number;
      leave: number;
    } = {
      user: null,
      attendance: 0,
      payroll: 0,
      leave: 0
    };

    // Delete attendance records
    const attendanceDelete = await Attendance.deleteMany({ user: targetUserId });
    deleteResults.attendance = attendanceDelete.deletedCount || 0;

    // Delete payroll records
    const payrollDelete = await Payroll.deleteMany({ user: targetUserId });
    deleteResults.payroll = payrollDelete.deletedCount || 0;

    // Delete leave records
    const leaveDelete = await Leave.deleteMany({ user: targetUserId });
    deleteResults.leave = leaveDelete.deletedCount || 0;

    // Finally delete the user
    const userDelete = await User.findByIdAndDelete(targetUserId);
    deleteResults.user = {
      id: targetUser._id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role
    };

    logger.info('Member deletion completed', session.user.id, getClientIP(req), 'delete-member', {
      deletedUser: {
        id: targetUserId,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role
      },
      deleteResults,
      deletedBy: session.user.id
    });

    const response = createSuccessResponse({
      message: 'Member deleted successfully',
      deletedUser: deleteResults.user,
      deletedRecords: {
        attendance: deleteResults.attendance,
        payroll: deleteResults.payroll,
        leave: deleteResults.leave
      }
    });

    return setSecurityHeaders(response);

  } catch (error: any) {
    logger.error('Member deletion failed', session.user.id, getClientIP(req), 'delete-member', error, {
      targetUserId: params.userId
    });
    
    const response = createErrorResponse('Internal server error', 500);
    return setSecurityHeaders(response);
  }
}
