import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { emailService } from "@/lib/customEmailService";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["Admin"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { to, subject, message } = await request.json();

    if (!to || !subject) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create test email HTML
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Test Email</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .footer { background: #1f2937; color: white; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EmPay HR System</h1>
            <p>Email Test</p>
          </div>
          <div class="content">
            <h2>Test Email</h2>
            <p>${message}</p>
            <p>This is a test email sent from EmPay HR System to verify your email configuration.</p>
            <p>If you received this email, your SMTP settings are working correctly!</p>
            <p>Best regards,<br>EmPay HR Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message from EmPay HR System.</p>
            <p>© 2026 EmPay Solutions Pvt Ltd. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await emailService.sendEmail({
      to,
      subject,
      html,
      text: message
    });

    return NextResponse.json({ 
      success: result.status === 'sent',
      message: result.status === 'sent' ? "Test email sent successfully" : "Failed to send test email",
      log: result
    });

  } catch (error) {
    console.error("Test email send error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
