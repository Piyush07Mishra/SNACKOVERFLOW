import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';
import { passwordChangeSchema, rateLimit, setSecurityHeaders, sanitizeInput, createErrorResponse, createSuccessResponse } from '@/lib/security';

// Get client IP for rate limiting
function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    const response = createErrorResponse('Unauthorized', 401);
    return setSecurityHeaders(response);
  }

  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    if (!rateLimit(`password-change:${session.user.id}`, 3, 15 * 60 * 1000)) { // 3 attempts per 15 minutes
      const response = createErrorResponse('Too many password change attempts. Please try again later.', 429);
      return setSecurityHeaders(response);
    }

    const body = await req.json();
    
    // Input validation
    const validation = passwordChangeSchema.safeParse(body);
    if (!validation.success) {
      const errorMessages = validation.error.issues.map((err: any) => err.message).join(', ');
      const response = createErrorResponse(`Validation failed: ${errorMessages}`, 400);
      return setSecurityHeaders(response);
    }

    const { currentPassword, newPassword } = validation.data;

    await dbConnect();
    const user = await User.findById(session.user.id);

    if (!user) {
      const response = createErrorResponse('User not found', 404);
      return setSecurityHeaders(response);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      const response = createErrorResponse('Incorrect current password', 400);
      return setSecurityHeaders(response);
    }

    // Validate new password strength
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(newPassword)) {
      const response = createErrorResponse('New password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character', 400);
      return setSecurityHeaders(response);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    const response = createSuccessResponse({ message: 'Password changed successfully' });
    return setSecurityHeaders(response);

  } catch (error: any) {
    console.error('Password change error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userId: session?.user?.id
    });
    
    const response = createErrorResponse('Internal server error', 500);
    return setSecurityHeaders(response);
  }
}
