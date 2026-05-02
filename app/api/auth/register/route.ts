import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { userRegistrationSchema, rateLimit, setSecurityHeaders, sanitizeInput, createErrorResponse, createSuccessResponse } from "@/lib/security";

// Get client IP for rate limiting
function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

export async function POST(req: Request) {
  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    if (!rateLimit(`register:${clientIP}`, 5, 15 * 60 * 1000)) { // 5 attempts per 15 minutes
      const response = createErrorResponse("Too many registration attempts. Please try again later.", 429);
      return setSecurityHeaders(response);
    }

    const body = await req.json();
    
    // Input validation
    const validation = userRegistrationSchema.safeParse(body);
    if (!validation.success) {
      const errorMessages = validation.error.issues.map((err: any) => err.message).join(', ');
      const response = createErrorResponse(`Validation failed: ${errorMessages}`, 400);
      return setSecurityHeaders(response);
    }

    const { name, email, password, role } = validation.data;

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email.toLowerCase().trim());

    await dbConnect();

    // Check if user already exists with sanitized email
    const existingUser = await User.findOne({ email: sanitizedEmail });

    if (existingUser) {
      const response = createErrorResponse("User already exists", 400);
      return setSecurityHeaders(response);
    }

    // Validate password strength
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      const response = createErrorResponse("Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character", 400);
      return setSecurityHeaders(response);
    }

    const hashedPassword = await bcrypt.hash(password, 12); // Use stronger salt rounds

    // If it's the first user ever, make them an Admin
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? "Admin" : (role || "Employee");

    const user = await User.create({
      name: sanitizedName,
      email: sanitizedEmail,
      password: hashedPassword,
      role: assignedRole,
    });

    // Don't return sensitive data
    const response = createSuccessResponse({ 
      message: "User registered successfully", 
      user: { id: user._id, email: user.email, role: user.role } 
    }, 201);
    return setSecurityHeaders(response);

  } catch (error: any) {
    console.error('Registration error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    const response = createErrorResponse("Internal server error", 500);
    return setSecurityHeaders(response);
  }
}
