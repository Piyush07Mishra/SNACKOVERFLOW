import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Leave } from "@/lib/models/Leave";
import { User } from "@/lib/models/User";
import { emailService } from "@/lib/customEmailService";

export async function GET() {
  try {
    console.log('🔧 Testing Leave Approval Email...');
    
    await dbConnect();
    
    // Find a pending leave request
    const pendingLeave = await Leave.findOne({ status: 'Pending' }).populate('user');
    
    if (!pendingLeave) {
      return NextResponse.json({ 
        success: false,
        message: 'No pending leave requests found'
      });
    }
    
    console.log('📝 Found pending leave:', pendingLeave._id);
    console.log('👤 Employee:', (pendingLeave.user as any).name, (pendingLeave.user as any).email);
    
    // Test email connection
    const connected = await emailService.testConnection();
    console.log('📡 Connection test:', connected);
    
    if (connected) {
      // Create a mock approver
      const approver = {
        name: 'Admin User',
        email: 'admin@emprepay.com'
      };
      
      console.log('📧 Sending approval email...');
      // Send approval email
      const emailResult = await emailService.sendLeaveApprovalEmail(
        pendingLeave.user,
        pendingLeave,
        approver,
        true // Approved
      );
      
      console.log('✅ Email send result:', emailResult);
      
      // Get stats
      const stats = emailService.getEmailStats();
      console.log('📊 Email stats:', stats);
      
      return NextResponse.json({ 
        success: true,
        message: 'Leave approval email test completed',
        leave: {
          id: pendingLeave._id,
          type: pendingLeave.type,
          employee: (pendingLeave.user as any).name,
          email: (pendingLeave.user as any).email
        },
        emailResult,
        stats
      });
    } else {
      return NextResponse.json({ 
        success: false,
        message: 'Email service connection failed'
      });
    }
    
  } catch (error) {
    console.error('❌ Leave email test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
