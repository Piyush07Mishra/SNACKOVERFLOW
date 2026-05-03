const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/empay');

async function testLeaveApprovalEmail() {
  try {
    console.log('🔧 Testing Leave Approval Email...');
    
    // Get models
    const User = mongoose.model('User', new mongoose.Schema({}, { collection: 'users', strict: false }));
    const Leave = mongoose.model('Leave', new mongoose.Schema({}, { collection: 'leaves', strict: false }));
    
    // Find a pending leave request
    const pendingLeave = await Leave.findOne({ status: 'Pending' });
    
    if (!pendingLeave) {
      console.log('❌ No pending leave requests found');
      return;
    }
    
    console.log('📝 Found pending leave:', pendingLeave._id);
    
    // Find employee
    const employee = await User.findById(pendingLeave.user);
    
    if (!employee) {
      console.log('❌ Employee not found for leave request');
      return;
    }
    
    console.log('👤 Employee found:', employee.name, employee.email);
    
    // Create a mock approver
    const approver = {
      name: 'Test Admin',
      email: 'admin@test.com'
    };
    
    // Import and use email service
    const { emailService } = require('../lib/customEmailService');
    
    // Test email connection
    console.log('📡 Testing email connection...');
    const connected = await emailService.testConnection();
    console.log('Connection result:', connected);
    
    if (connected) {
      // Send approval email
      console.log('📧 Sending approval email...');
      const emailResult = await emailService.sendLeaveApprovalEmail(
        employee,
        pendingLeave,
        approver,
        true // Approved
      );
      
      console.log('✅ Email send result:', emailResult);
      
      // Show email stats
      const stats = emailService.getEmailStats();
      console.log('📊 Email Stats:', stats);
      
      // Show email logs
      const logs = emailService.getEmailLogs();
      console.log('📝 Email Logs:');
      logs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.subject} -> ${log.to} (${log.status})`);
        if (log.error) {
          console.log(`   Error: ${log.error}`);
        }
      });
      
    } else {
      console.log('❌ Email service not connected');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testLeaveApprovalEmail();
