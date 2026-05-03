import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { emailService } from "@/lib/customEmailService";

export async function GET() {
  try {
    console.log('🔧 Testing Email Targeting...');
    
    await dbConnect();
    
    // Get sample users to test targeting
    const users = await User.find({}).limit(10);
    
    console.log('👥 Found users:', users.length);
    
    // Test 1: Leave request targeting
    console.log('\n📝 Test 1: Leave Request Email Targeting');
    
    const sampleEmployee = users.find(u => u.role === 'Employee');
    if (sampleEmployee) {
      console.log(`👤 Sample Employee: ${sampleEmployee.name} (${sampleEmployee.email})`);
      console.log(`📋 Manager: ${sampleEmployee.manager || 'Not set'}`);
      
      // Find approvers based on the new logic
      let approvers = [];
      
      if (sampleEmployee.manager) {
        const manager = await User.findOne({ 
          name: sampleEmployee.manager,
          role: { $in: ['Admin', 'HR_Officer', 'Payroll_Officer'] }
        });
        
        if (manager) {
          approvers.push(manager);
          console.log(`✅ Found manager: ${manager.name} (${manager.email})`);
        }
      }
      
      if (approvers.length === 0) {
        approvers = await User.find({
          role: { $in: ['Admin', 'HR_Officer'] }
        });
        console.log(`📧 No manager found, would send to ${approvers.length} HR/Admin users`);
        approvers.forEach(approver => {
          console.log(`   - ${approver.name} (${approver.email})`);
        });
      }
    }
    
    // Test 2: Payroll email targeting
    console.log('\n💰 Test 2: Payroll Email Targeting');
    
    const employees = users.filter(u => u.role === 'Employee');
    const payrollOfficers = users.filter(u => u.role === 'Payroll_Officer' || u.role === 'Admin');
    
    console.log(`👥 Employees: ${employees.length} would receive individual payroll emails`);
    console.log(`👨‍💼 Payroll Officers/Admins: ${payrollOfficers.length} would receive approval emails`);
    
    employees.slice(0, 3).forEach(emp => {
      console.log(`   - ${emp.name} (${emp.email})`);
    });
    
    payrollOfficers.forEach(officer => {
      console.log(`   - ${officer.name} (${officer.email})`);
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Email targeting test completed',
      results: {
        totalUsers: users.length,
        employees: employees.length,
        payrollOfficers: payrollOfficers.length,
        sampleEmployee: sampleEmployee ? {
          name: sampleEmployee.name,
          email: sampleEmployee.email,
          manager: sampleEmployee.manager
        } : null
      }
    });
    
  } catch (error) {
    console.error('❌ Email targeting test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
