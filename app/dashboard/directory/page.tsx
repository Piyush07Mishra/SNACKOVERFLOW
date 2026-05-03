import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { Company } from '@/lib/models/Company';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { DirectoryClient } from './client';

export default async function DirectoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userRole = (session.user as any).role;
  const canManage = ['Admin', 'HR_Officer'].includes(userRole);

  await dbConnect();

  // Fetch the current user to get their companyId
  const currentUser = await User.findById(session.user.id).lean();
  if (!currentUser?.companyId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Employee Directory</h1>
        <p className="text-destructive">Company not found. Please contact your administrator.</p>
      </div>
    );
  }

  // Fetch company for companyCode (needed for ID preview in UI)
  const company = await Company.findById(currentUser.companyId).lean();

  // Fetch all employees in the same company, sorted by name
  const employees = await User.find({ companyId: currentUser.companyId })
    .sort({ name: 1 })
    .lean();

  const serializedEmployees = employees.map((emp) => ({
    _id: emp._id.toString(),
    name: emp.name || `${emp.firstName} ${emp.lastName}`.trim(),
    firstName: emp.firstName,
    lastName: emp.lastName,
    email: emp.email,
    role: emp.role,
    employeeId: emp.employeeId || '',
    designation: emp.jobPosition || '',
    department: emp.department || '',
    basicSalary: emp.basicSalary || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Directory</h1>
          <p className="text-muted-foreground">
            Manage and view employee information — {serializedEmployees.length} employee
            {serializedEmployees.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <DirectoryClient
        employees={serializedEmployees}
        canManage={canManage}
        companyCode={(company as any)?.companyCode ?? 'CO'}
      />
    </div>
  );
}
