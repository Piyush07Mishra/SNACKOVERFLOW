import { NextResponse } from 'next/server';
import { z } from 'zod';

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Input validation schemas
export const userRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email format').max(100, 'Email must be less than 100 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password must be less than 128 characters'),
  role: z.enum(['Admin', 'Employee', 'HR_Officer', 'Payroll_Officer']).optional()
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128, 'Password must be less than 128 characters')
});

export const attendanceNoteSchema = z.object({
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional()
});

// Rate limiting middleware
export function rateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const key = `${identifier}:${Math.floor(now / windowMs)}`;
  
  const record = rateLimitStore.get(key);
  if (record && record.count >= limit) {
    return false;
  }
  
  if (record) {
    record.count++;
  } else {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
  }
  
  // Clean old entries
  for (const [oldKey, oldRecord] of rateLimitStore.entries()) {
    if (oldRecord.resetTime < now) {
      rateLimitStore.delete(oldKey);
    }
  }
  
  return true;
}

// Security headers
export function setSecurityHeaders(response: Response) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove potential JS
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

// Error response helper
export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { error: message },
    { 
      status,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    }
  );
}

// Success response helper
export function createSuccessResponse(data: any, status: number = 200) {
  return NextResponse.json(
    data,
    { 
      status,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    }
  );
}
