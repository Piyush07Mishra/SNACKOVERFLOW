const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/empay');

// Import email service
async function testEmailService() {
  try {
    console.log('🔧 Testing Email Service...');
    
    // Import the email service
    const { emailService } = require('../lib/customEmailService');
    
    // Test connection
    console.log('📡 Testing SMTP connection...');
    const connected = await emailService.testConnection();
    console.log('Connection result:', connected);
    
    if (connected) {
      // Send a test email
      console.log('📧 Sending test email...');
      const result = await emailService.sendEmail({
        to: 'mahendrakumarsuthar189@gmail.com',
        subject: 'Test Email from EmPay System',
        html: `
          <h2>Email Service Test</h2>
          <p>This is a test email from the EmPay HR System.</p>
          <p>If you receive this email, the service is working correctly.</p>
          <p>Sent at: ${new Date().toLocaleString()}</p>
        `
      });
      
      console.log('Email send result:', result);
    }
    
    // Show email stats
    const stats = emailService.getEmailStats();
    console.log('📊 Email Stats:', stats);
    
    // Show email logs
    const logs = emailService.getEmailLogs();
    console.log('📝 Email Logs:');
    logs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.subject} -> ${log.to} (${log.status})`);
    });
    
  } catch (error) {
    console.error('❌ Email service test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testEmailService();
