import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { createErrorResponse, createSuccessResponse, setSecurityHeaders } from '@/lib/security';
import QRCode from 'qrcode';

function hasQrAccess(role?: string) {
  return ['Admin', 'HR_Officer', 'Payroll_Officer'].includes(role || '');
}

export async function GET(
  req: Request,
  context: { params: Promise<{ employeeId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return setSecurityHeaders(createErrorResponse('Unauthorized', 401));
  }

  try {
    const { employeeId } = await context.params;
    await dbConnect();

    const currentUser = await User.findById(session.user.id).select('companyId employeeId role').lean();
    if (!currentUser?.companyId) {
      return setSecurityHeaders(createErrorResponse('User company not found', 400));
    }

    if (!hasQrAccess(currentUser.role) && currentUser.employeeId !== employeeId) {
      return setSecurityHeaders(createErrorResponse('Forbidden', 403));
    }

    const employee = await User.findOne({
      companyId: currentUser.companyId,
      employeeId,
    })
      .select('_id employeeId name email')
      .lean();

    if (!employee) {
      return setSecurityHeaders(createErrorResponse('Employee not found', 404));
    }

    const origin = new URL(req.url).origin;
    const checkInUrl = `${origin}/attendance/checkin?empId=${encodeURIComponent(employee.employeeId)}`;
    const qrDataUrl = await QRCode.toDataURL(checkInUrl);

    return setSecurityHeaders(
      createSuccessResponse({
        success: true,
        employee: {
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email,
        },
        checkInUrl,
        qrDataUrl,
      })
    );
  } catch (error: any) {
    console.error('QR generation error:', error);
    return setSecurityHeaders(createErrorResponse('Internal Server Error', 500));
  }
}
