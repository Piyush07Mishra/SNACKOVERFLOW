import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AttendanceCheckinClient } from './ui-client';

export default async function AttendanceCheckinPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  if ((session.user as any)?.role !== 'Employee') {
    redirect('/dashboard');
  }

  return <AttendanceCheckinClient />;
}
