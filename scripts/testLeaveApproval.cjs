const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/empay');

async function testLeaveApproval() {
  try {
    console.log('🔧 Testing Leave Approval Email...');
    
    // Get models
    const Leave = mongoose.model('Leave', new mongoose.Schema({}, { collection: 'leaves', strict: false }));
    const User = mongoose.model('User', new mongoose.Schema({}, { collection: 'users', strict: false }));
    
    // Find a pending leave request
    const pendingLeave = await Leave.findOne({ status: 'Pending' });
    
    if (!pendingLeave) {
      console.log('❌ No pending leave requests found');
      return;
    }
    
    console.log('📝 Found pending leave:', pendingLeave._id);
    console.log('📝 Leave details:', {
      type: pendingLeave.type,
      startDate: pendingLeave.startDate,
      endDate: pendingLeave.endDate,
      user: pendingLeave.user
    });
    
    // Find the employee
    const employee = await User.findById(pendingLeave.user);
    
    if (!employee) {
      console.log('❌ Employee not found for leave request');
      return;
    }
    
    console.log('👤 Employee found:', employee.name, employee.email);
    
    // Import email service
    const { emailService } = require('../lib/customEmailService');
    
    // Test email connection
    console.log('📡 Testing email connection...');
    const connected = await emailService.testConnection();
    console.log('Connection result:', connected);
    
    if (connected) {
      // Create a mock approver
      const approver = {
        name: 'Admin User',
        email: 'admin@emprepay.com'
      };
      
      console.log('📧 Sending approval email...');
      // Send approval email
      const emailResult = await emailService.sendLeaveApprovalEmail(
        employee,
        pendingLeave,
        approver,
        true // Approved
      );
      
      console.log('✅ Email send result:', emailResult);
      
      // Update the leave status to Approved
      const updatedLeave = await Leave.findByIdAndUpdate(
        pendingLeave._id,
        { 
          status: 'Approved',
          approvedBy: '69f6785df2b251b0656d893f' // Admin user ID
        },
        { new: true }
      );
      
      console.log('✅ Leave updated to Approved:', updatedLeave.status);
      
      // Show email stats
      const stats = emailService.getEmailStats();
      console.log('📊 Email Stats:', stats);
      
    } else {
      console.log('❌ Email service not connected');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testLeaveApproval();
