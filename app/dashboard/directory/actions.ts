'use server';

import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { Company } from '@/lib/models/Company';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';
import { getNextSerial } from '@/lib/services/counterService';
import { generateEmployeeId } from '@/lib/services/employeeIdService';
import { sendWelcomeEmail } from '@/lib/services/emailService';

// ─── Helper ──────────────────────────────────────────────────────────────────
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
  let pwd = '';
  // Guarantee at least one uppercase, one lowercase, one digit, one symbol
  pwd += 'ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random() * 23)];
  pwd += 'abcdefghjkmnpqrstuvwxyz'[Math.floor(Math.random() * 23)];
  pwd += '23456789'[Math.floor(Math.random() * 8)];
  pwd += '@#$!'[Math.floor(Math.random() * 4)];
  for (let i = 4; i < 10; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

// ─── Create Employee ──────────────────────────────────────────────────────────
export async function createEmployee(data: {
  firstName: string;
  lastName: string;
  email: string;
  joiningDate: string; // ISO date string from form
  role?: string;
  designation?: string;
  department?: string;
  basicSalary?: number;
}) {
  // ── 1. Auth check ──────────────────────────────────────────────────────────
  const session = await auth();
  if (
    !session?.user?.id ||
    !['Admin', 'HR_Officer'].includes((session.user as any).role)
  ) {
    throw new Error('Unauthorized');
  }

  // ── 2. Validate required fields ────────────────────────────────────────────
  if (!data.firstName || !data.lastName || !data.email || !data.joiningDate) {
    throw new Error('First name, last name, email and joining date are required');
  }

  await dbConnect();

  // ── 3. Fetch current user to get companyId ─────────────────────────────────
  const currentUser = await User.findById(session.user.id);
  if (!currentUser?.companyId) {
    throw new Error('User company not found. Please contact administrator.');
  }
  const companyId = currentUser.companyId;

  // ── 4. Fetch company (need companyCode for ID generation) ──────────────────
  const company = await Company.findById(companyId);
  if (!company?.companyCode) {
    throw new Error('Company configuration incomplete. Missing company code.');
  }

  // ── 5. Check for duplicate email within this company ──────────────────────
  const normalizedEmail = data.email.trim().toLowerCase();
  const existing = await User.findOne({ companyId, email: normalizedEmail });
  if (existing) {
    throw new Error('An employee with this email already exists in your company');
  }

  // ── 6. Extract year from joining date ─────────────────────────────────────
  const joiningDate = new Date(data.joiningDate);
  const year = joiningDate.getFullYear();

  // ── 7. Get atomic serial & generate employee ID ───────────────────────────
  const serial = await getNextSerial(companyId, year);
  const employeeId = generateEmployeeId(
    company.companyCode,
    data.firstName,
    data.lastName,
    year,
    serial
  );

  // ── 8. Generate & hash temp password ──────────────────────────────────────
  const tempPassword = generateTempPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  // ── 9. Create user ─────────────────────────────────────────────────────────
  const role = data.role || 'Employee';

  await User.create({
    companyId,
    firstName: data.firstName,
    lastName: data.lastName,
    name: `${data.firstName} ${data.lastName}`.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role,
    employeeId,
    joiningDate,
    jobPosition: data.designation || '',
    department: data.department || '',
    basicSalary: data.basicSalary || 0,
  });

  // ── 10. Send welcome email only for Employee accounts ────────────────────
  if (role === 'Employee') {
    sendWelcomeEmail({
      to: data.email,
      name: `${data.firstName} ${data.lastName}`,
      employeeId,
      tempPassword,
    });
  }

  revalidatePath('/dashboard/directory');
}

// ─── Update Employee ──────────────────────────────────────────────────────────
export async function updateEmployee(id: string, data: any) {
  const session = await auth();
  if (
    !session?.user?.id ||
    !['Admin', 'HR_Officer'].includes((session.user as any).role)
  ) {
    throw new Error('Unauthorized');
  }

  await dbConnect();

  const currentUser = await User.findById(session.user.id);
  if (!currentUser?.companyId) {
    throw new Error('User company not found. Please contact administrator.');
  }

  // Verify the target employee belongs to the same company
  const employee = await User.findById(id);
  if (!employee || employee.companyId?.toString() !== currentUser.companyId.toString()) {
    throw new Error('Employee not found or access denied');
  }

  // Build update — if firstName/lastName changed, name will be auto-updated via pre-save
  const updateData: any = { ...data };
  if (updateData.firstName || updateData.lastName) {
    const newFirst = updateData.firstName || employee.firstName;
    const newLast = updateData.lastName || employee.lastName;
    updateData.name = `${newFirst} ${newLast}`.trim();
  }

  await User.findByIdAndUpdate(id, updateData, { new: true });

  revalidatePath('/dashboard/directory');
}

// ─── Delete Employee ──────────────────────────────────────────────────────────
export async function deleteEmployee(id: string) {
  const session = await auth();
  if (
    !session?.user?.id ||
    !['Admin', 'HR_Officer'].includes((session.user as any).role)
  ) {
    throw new Error('Unauthorized');
  }

  await dbConnect();

  const currentUser = await User.findById(session.user.id);
  if (!currentUser?.companyId) {
    throw new Error('User company not found. Please contact administrator.');
  }

  const targetUser = await User.findById(id);
  if (!targetUser || targetUser.companyId?.toString() !== currentUser.companyId.toString()) {
    throw new Error('Employee not found or access denied');
  }

  // Only Admin can delete their own account.
  if (targetUser.id === session.user.id && (session.user as any).role !== 'Admin') {
    throw new Error('Cannot delete yourself');
  }

  if (targetUser.role === 'Admin' && (session.user as any)?.role !== 'Admin') {
    throw new Error('Cannot delete admin users');
  }

  const deletedSelf = targetUser.id === session.user.id;

  try {
    const deletedAttendance = await (await import('@/lib/models/Attendance')).Attendance.deleteMany({ user: id });
    const deletedAttendanceSessions = await (await import('@/lib/models/AttendanceSession')).AttendanceSession.deleteMany({ userId: id });
    const deletedPayroll = await (await import('@/lib/models/Payroll')).Payroll.deleteMany({ user: id });
    const deletedLeave = await (await import('@/lib/models/Leave')).Leave.deleteMany({ user: id });

    const deletedUser = await User.findByIdAndDelete(id);

    console.log('Member deletion completed', {
      deletedUser: {
        id: id,
        email: deletedUser?.email,
        name: deletedUser?.name,
        role: deletedUser?.role,
      },
      deletedRecords: {
        attendance: deletedAttendance.deletedCount || 0,
        attendanceSessions: deletedAttendanceSessions.deletedCount || 0,
        payroll: deletedPayroll.deletedCount || 0,
        leave: deletedLeave.deletedCount || 0,
      },
      deletedBy: session.user.id,
    });

    revalidatePath('/dashboard/directory');

    return {
      message: 'Member deleted successfully',
      deletedSelf,
      deletedUser: {
        id,
        email: deletedUser?.email,
        name: deletedUser?.name,
        role: deletedUser?.role,
      },
      deletedRecords: {
        attendance: deletedAttendance.deletedCount || 0,
        attendanceSessions: deletedAttendanceSessions.deletedCount || 0,
        payroll: deletedPayroll.deletedCount || 0,
        leave: deletedLeave.deletedCount || 0,
      },
    };
  } catch (error: any) {
    console.error('Delete employee error:', error);
    throw new Error(error.message || 'Failed to delete employee');
  }
}
