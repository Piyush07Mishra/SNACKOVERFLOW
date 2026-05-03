import nodemailer from 'nodemailer';
import { User } from './models/User';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    address: string;
  };
}

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
  sentAt?: Date;
  createdAt: Date;
  messageId?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;
  private emailLogs: EmailLog[] = [];

  constructor(config?: EmailConfig) {
    // Default configuration - can be overridden with environment variables
    this.config = config || {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
      },
      from: {
        name: process.env.EMAIL_FROM_NAME || 'EmPay HR System',
        address: process.env.EMAIL_FROM_ADDRESS || 'noreply@emprepay.com'
      }
    };

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }

  async sendEmail(email: EmailTemplate): Promise<EmailLog> {
    const emailLog: EmailLog = {
      id: Date.now().toString(),
      to: email.to,
      subject: email.subject,
      status: 'pending',
      createdAt: new Date()
    };

    try {
      const mailOptions = {
        from: `${this.config.from.name} <${this.config.from.address}>`,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text || this.htmlToText(email.html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      emailLog.status = 'sent';
      emailLog.sentAt = new Date();
      emailLog.messageId = result.messageId;
      
      console.log(`✅ Email sent to ${email.to}: ${email.subject}`);
      console.log(`   Message ID: ${result.messageId}`);
      
      this.emailLogs.push(emailLog);
      return emailLog;
      
    } catch (error) {
      emailLog.status = 'failed';
      emailLog.error = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`❌ Failed to send email to ${email.to}:`, error);
      this.emailLogs.push(emailLog);
      return emailLog;
    }
  }

  async sendLeaveApprovalEmail(
    employee: any,
    leave: any,
    approver: any,
    approved: boolean
  ): Promise<EmailLog> {
    const subject = approved 
      ? `Leave Approved - ${leave.type} from ${leave.startDate} to ${leave.endDate}`
      : `Leave Rejected - ${leave.type} from ${leave.startDate} to ${leave.endDate}`;

    const html = this.generateLeaveApprovalEmail(employee, leave, approver, approved);
    
    return await this.sendEmail({
      to: employee.email,
      subject,
      html
    });
  }

  async sendLeaveRequestEmail(
    employee: any,
    leave: any,
    approver: any
  ): Promise<EmailLog> {
    const subject = `Leave Request - ${employee.name} - ${leave.type} from ${leave.startDate} to ${leave.endDate}`;
    
    const html = this.generateLeaveRequestEmail(employee, leave, approver);
    
    return await this.sendEmail({
      to: approver.email,
      subject,
      html
    });
  }

  async sendPayrollProcessedEmail(
    employee: any,
    payroll: any
  ): Promise<EmailLog> {
    const subject = `Payroll Processed - ${payroll.month} - ₹${payroll.netSalary.toLocaleString()}`;
    
    const html = this.generatePayrollEmail(employee, payroll);
    
    return await this.sendEmail({
      to: employee.email,
      subject,
      html
    });
  }

  async sendPayrollApprovalEmail(
    employees: any[],
    payrollMonth: string,
    approver: any
  ): Promise<EmailLog> {
    const subject = `Payroll Approval Required - ${payrollMonth} - ${employees.length} employees`;
    
    const html = this.generatePayrollApprovalEmail(employees, payrollMonth, approver);
    
    return await this.sendEmail({
      to: approver.email,
      subject,
      html
    });
  }

  async sendWelcomeEmail(employee: any, tempPassword: string): Promise<EmailLog> {
    const subject = `Welcome to EmPay HR System - Your Account Details`;
    
    const html = this.generateWelcomeEmail(employee, tempPassword);
    
    return await this.sendEmail({
      to: employee.email,
      subject,
      html
    });
  }

  async sendPasswordResetEmail(employee: any, resetLink: string): Promise<EmailLog> {
    const subject = `Password Reset Request - EmPay HR System`;
    
    const html = this.generatePasswordResetEmail(employee, resetLink);
    
    return await this.sendEmail({
      to: employee.email,
      subject,
      html
    });
  }

  private generateLeaveApprovalEmail(
    employee: any,
    leave: any,
    approver: any,
    approved: boolean
  ): string {
    const status = approved ? 'Approved' : 'Rejected';
    const statusColor = approved ? '#10b981' : '#ef4444';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Leave ${status}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .status { background: ${statusColor}; color: white; padding: 10px 20px; border-radius: 5px; text-align: center; font-weight: bold; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { background: #1f2937; color: white; padding: 20px; text-align: center; font-size: 12px; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .detail-label { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EmPay HR System</h1>
            <p>Leave Management</p>
          </div>
          
          <div class="content">
            <h2>Leave Request ${status}</h2>
            <p>Dear ${employee.name},</p>
            
            <div class="status">
              Your leave request has been ${status.toLowerCase()}
            </div>
            
            <div class="details">
              <h3>Leave Details:</h3>
              <div class="detail-row">
                <span class="detail-label">Leave Type:</span>
                <span>${leave.type}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Start Date:</span>
                <span>${leave.startDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">End Date:</span>
                <span>${leave.endDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Reason:</span>
                <span>${leave.reason}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Approved By:</span>
                <span>${approver.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Approval Date:</span>
                <span>${new Date().toLocaleDateString()}</span>
              </div>
            </div>
            
            <p>${approved 
              ? 'Your leave has been approved. Please ensure your work is handed over properly before your departure.'
              : 'Your leave request has been rejected. Please contact your manager for more details.'
            }</p>
            
            <p>Best regards,<br>EmPay HR Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from EmPay HR System. Please do not reply to this email.</p>
            <p>© 2026 EmPay Solutions Pvt Ltd. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateLeaveRequestEmail(
    employee: any,
    leave: any,
    approver: any
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Leave Request Approval</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .action-required { background: #f59e0b; color: white; padding: 10px 20px; border-radius: 5px; text-align: center; font-weight: bold; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { background: #1f2937; color: white; padding: 20px; text-align: center; font-size: 12px; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .detail-label { font-weight: bold; }
          .btn { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EmPay HR System</h1>
            <p>Leave Management</p>
          </div>
          
          <div class="content">
            <h2>Leave Request Approval Required</h2>
            <p>Dear ${approver.name},</p>
            
            <div class="action-required">
              Action Required: Leave Request Pending Approval
            </div>
            
            <div class="details">
              <h3>Employee Details:</h3>
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span>${employee.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span>${employee.email}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Department:</span>
                <span>${employee.department}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Position:</span>
                <span>${employee.jobPosition}</span>
              </div>
              
              <h3>Leave Details:</h3>
              <div class="detail-row">
                <span class="detail-label">Leave Type:</span>
                <span>${leave.type}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Start Date:</span>
                <span>${leave.startDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">End Date:</span>
                <span>${leave.endDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Reason:</span>
                <span>${leave.reason}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Requested On:</span>
                <span>${new Date(leave.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <p>Please review this leave request and take appropriate action.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/leaves" class="btn">Review Leave Request</a>
            </div>
            
            <p>Best regards,<br>EmPay HR Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from EmPay HR System. Please do not reply to this email.</p>
            <p>© 2026 EmPay Solutions Pvt Ltd. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePayrollEmail(employee: any, payroll: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payroll Processed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .success { background: #10b981; color: white; padding: 10px 20px; border-radius: 5px; text-align: center; font-weight: bold; margin: 20px 0; }
          .payroll-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { background: #1f2937; color: white; padding: 20px; text-align: center; font-size: 12px; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .detail-label { font-weight: bold; }
          .amount { font-weight: bold; color: #059669; }
          .deduction { color: #dc2626; }
          .btn { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EmPay HR System</h1>
            <p>Payroll Management</p>
          </div>
          
          <div class="content">
            <h2>Payroll Processed</h2>
            <p>Dear ${employee.name},</p>
            
            <div class="success">
              Your payroll for ${payroll.month} has been processed
            </div>
            
            <div class="payroll-details">
              <h3>Payroll Summary - ${payroll.month}</h3>
              
              <h4>Earnings:</h4>
              <div class="detail-row">
                <span class="detail-label">Basic Salary:</span>
                <span>₹${payroll.basicSalary.toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Payable Days:</span>
                <span>${payroll.payableDays} days</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Overtime Hours:</span>
                <span>${payroll.overtimeHours} hrs</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Overtime Pay:</span>
                <span>₹${payroll.overtimePay.toLocaleString()}</span>
              </div>
              
              <div class="detail-row" style="border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 15px;">
                <span class="detail-label">Total Earnings:</span>
                <span class="amount">₹${payroll.totalEarnings.toLocaleString()}</span>
              </div>
              
              <h4 style="margin-top: 20px;">Deductions:</h4>
              <div class="detail-row">
                <span class="detail-label">PF Deduction:</span>
                <span class="deduction">-₹${payroll.pfDeduction.toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Professional Tax:</span>
                <span class="deduction">-₹${payroll.professionalTax.toLocaleString()}</span>
              </div>
              
              <div class="detail-row" style="border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 15px;">
                <span class="detail-label">Total Deductions:</span>
                <span class="deduction">-₹${payroll.totalDeductions.toLocaleString()}</span>
              </div>
              
              <div class="detail-row" style="border-top: 2px solid #1f2937; padding-top: 15px; margin-top: 20px; font-size: 18px;">
                <span class="detail-label">Net Salary:</span>
                <span class="amount" style="font-size: 20px;">₹${payroll.netSalary.toLocaleString()}</span>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/payroll" class="btn">View Payslip</a>
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/payroll/download/${payroll._id}" class="btn">Download Payslip</a>
            </div>
            
            <p>Your salary has been processed and will be credited to your bank account as per the company's payroll schedule.</p>
            
            <p>Best regards,<br>EmPay HR Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from EmPay HR System. Please do not reply to this email.</p>
            <p>© 2026 EmPay Solutions Pvt Ltd. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePayrollApprovalEmail(
    employees: any[],
    payrollMonth: string,
    approver: any
  ): string {
    const totalAmount = employees.reduce((sum, emp) => sum + (emp.netSalary || 0), 0);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payroll Approval Required</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .action-required { background: #f59e0b; color: white; padding: 10px 20px; border-radius: 5px; text-align: center; font-weight: bold; margin: 20px 0; }
          .summary { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { background: #1f2937; color: white; padding: 20px; text-align: center; font-size: 12px; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .detail-label { font-weight: bold; }
          .btn { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 5px; }
          .employee-list { max-height: 300px; overflow-y: auto; }
          .employee-item { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EmPay HR System</h1>
            <p>Payroll Management</p>
          </div>
          
          <div class="content">
            <h2>Payroll Approval Required</h2>
            <p>Dear ${approver.name},</p>
            
            <div class="action-required">
              Action Required: Payroll Approval for ${payrollMonth}
            </div>
            
            <div class="summary">
              <h3>Payroll Summary - ${payrollMonth}</h3>
              <div class="detail-row">
                <span class="detail-label">Total Employees:</span>
                <span>${employees.length}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Amount:</span>
                <span>₹${totalAmount.toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Generated On:</span>
                <span>${new Date().toLocaleDateString()}</span>
              </div>
              
              <h4 style="margin-top: 20px;">Employee List:</h4>
              <div class="employee-list">
                ${employees.map(emp => `
                  <div class="employee-item">
                    <div class="detail-row">
                      <span>${emp.name}</span>
                      <span>₹${emp.netSalary?.toLocaleString() || 'N/A'}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <p>Please review the payroll details and approve for processing.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/payroll/approve" class="btn">Review & Approve Payroll</a>
            </div>
            
            <p>Best regards,<br>EmPay HR Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from EmPay HR System. Please do not reply to this email.</p>
            <p>© 2026 EmPay Solutions Pvt Ltd. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeEmail(employee: any, tempPassword: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to EmPay HR System</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .welcome { background: #3b82f6; color: white; padding: 15px 20px; border-radius: 5px; text-align: center; font-weight: bold; margin: 20px 0; }
          .credentials { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 2px solid #e5e7eb; }
          .footer { background: #1f2937; color: white; padding: 20px; text-align: center; font-size: 12px; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .detail-label { font-weight: bold; }
          .btn { background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EmPay HR System</h1>
            <p>Employee Management Portal</p>
          </div>
          
          <div class="content">
            <h2>Welcome to EmPay HR System!</h2>
            <p>Dear ${employee.name},</p>
            
            <div class="welcome">
              Welcome aboard! Your account has been created successfully.
            </div>
            
            <div class="credentials">
              <h3>Your Login Credentials:</h3>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span>${employee.email}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Temporary Password:</span>
                <span style="font-family: monospace; background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">${tempPassword}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Role:</span>
                <span>${employee.role}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Department:</span>
                <span>${employee.department}</span>
              </div>
            </div>
            
            <p>Please log in using the credentials above and change your password immediately for security purposes.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" class="btn">Login to Your Account</a>
            </div>
            
            <p>If you have any questions or need assistance, please contact the HR department.</p>
            
            <p>Best regards,<br>EmPay HR Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from EmPay HR System. Please do not reply to this email.</p>
            <p>© 2026 EmPay Solutions Pvt Ltd. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePasswordResetEmail(employee: any, resetLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .reset-info { background: #f59e0b; color: white; padding: 15px 20px; border-radius: 5px; text-align: center; font-weight: bold; margin: 20px 0; }
          .footer { background: #1f2937; color: white; padding: 20px; text-align: center; font-size: 12px; }
          .btn { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EmPay HR System</h1>
            <p>Employee Management Portal</p>
          </div>
          
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Dear ${employee.name},</p>
            
            <div class="reset-info">
              A password reset request has been initiated for your account
            </div>
            
            <p>If you requested this password reset, please click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" class="btn">Reset Your Password</a>
            </div>
            
            <p><strong>Important:</strong></p>
            <ul>
              <li>This link will expire in 24 hours</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Never share this link with anyone</li>
            </ul>
            
            <p>If you continue to have issues, please contact the HR department.</p>
            
            <p>Best regards,<br>EmPay HR Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from EmPay HR System. Please do not reply to this email.</p>
            <p>© 2026 EmPay Solutions Pvt Ltd. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  getEmailLogs(): EmailLog[] {
    return this.emailLogs;
  }

  clearEmailLogs(): void {
    this.emailLogs = [];
  }

  getEmailStats() {
    const sent = this.emailLogs.filter(log => log.status === 'sent').length;
    const failed = this.emailLogs.filter(log => log.status === 'failed').length;
    const pending = this.emailLogs.filter(log => log.status === 'pending').length;
    
    return {
      total: this.emailLogs.length,
      sent,
      failed,
      pending,
      successRate: this.emailLogs.length > 0 ? (sent / this.emailLogs.length * 100).toFixed(1) : '0'
    };
  }
}

// Singleton instance
export const emailService = new EmailService();

export default EmailService;
