import { NextResponse } from "next/server";
import { emailService } from "@/lib/customEmailService";

export async function GET() {
  try {
    console.log('🔧 Testing email service in Next.js environment...');
    
    // Test connection
    const connected = await emailService.testConnection();
    console.log('✅ Connection test result:', connected);
    
    if (connected) {
      // Send test email
      const result = await emailService.sendEmail({
        to: 'mahendrakumarsuthar189@gmail.com',
        subject: 'Test Email from EmPay HR System',
        html: `
          <h2>📧 Email Service Test</h2>
          <p>This is a test email from the EmPay HR System.</p>
          <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
          <p>If you receive this email, the email service is working correctly!</p>
          <hr>
          <p>Best regards,<br>EmPay HR Team</p>
        `
      });
      
      console.log('📧 Email send result:', result);
      
      // Get stats
      const stats = emailService.getEmailStats();
      console.log('📊 Email stats:', stats);
      
      return NextResponse.json({ 
        success: true,
        message: 'Email service test completed',
        connection: connected,
        emailResult: result,
        stats
      });
    } else {
      return NextResponse.json({ 
        success: false,
        message: 'Email service connection failed',
        connection: connected
      });
    }
    
  } catch (error) {
    console.error('❌ Email service test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
