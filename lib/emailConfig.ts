import { EmailConfig } from './customEmailService';

export interface EmailSettings {
  enabled: boolean;
  smtp: EmailConfig;
  notifications: {
    leaveApproval: boolean;
    leaveRequest: boolean;
    payrollProcessed: boolean;
    payrollApproval: boolean;
    welcomeEmail: boolean;
    passwordReset: boolean;
  };
  templates: {
    logoUrl?: string;
    companyName: string;
    companyAddress: string;
    supportEmail: string;
    supportPhone: string;
  };
}

export const defaultEmailSettings: EmailSettings = {
  enabled: process.env.EMAIL_ENABLED === 'true',
  smtp: {
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
  },
  notifications: {
    leaveApproval: process.env.EMAIL_LEAVE_APPROVAL !== 'false',
    leaveRequest: false,
    payrollProcessed: false,
    payrollApproval: false,
    welcomeEmail: false,
    passwordReset: false
  },
  templates: {
    logoUrl: process.env.EMAIL_LOGO_URL || '',
    companyName: process.env.COMPANY_NAME || 'EmPay Solutions Pvt Ltd',
    companyAddress: process.env.COMPANY_ADDRESS || '123 Business Park, Mumbai, India',
    supportEmail: process.env.SUPPORT_EMAIL || 'hr@emprepay.com',
    supportPhone: process.env.SUPPORT_PHONE || '+91-9876543210'
  }
};

export class EmailConfigManager {
  private settings: EmailSettings;

  constructor(settings?: Partial<EmailSettings>) {
    this.settings = { ...defaultEmailSettings, ...settings };
  }

  getSettings(): EmailSettings {
    return this.settings;
  }

  updateSettings(updates: Partial<EmailSettings>): void {
    this.settings = { ...this.settings, ...updates };
  }

  isNotificationEnabled(type: keyof EmailSettings['notifications']): boolean {
    return this.settings.enabled && this.settings.notifications[type];
  }

  getSmtpConfig(): EmailConfig {
    return this.settings.smtp;
  }

  getTemplateSettings(): EmailSettings['templates'] {
    return this.settings.templates;
  }

  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.settings.smtp.host) {
      errors.push('SMTP host is required');
    }

    if (!this.settings.smtp.auth.user) {
      errors.push('SMTP username is required');
    }

    if (!this.settings.smtp.auth.pass) {
      errors.push('SMTP password is required');
    }

    if (!this.settings.smtp.from.address) {
      errors.push('From email address is required');
    }

    if (!this.settings.templates.companyName) {
      errors.push('Company name is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      // Import here to avoid circular dependency
      const { emailService } = await import('./customEmailService');
      return await emailService.testConnection();
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }

  // Method to save settings to environment or database
  async saveSettings(): Promise<void> {
    // This could be implemented to save to a database or .env file
    console.log('Email settings saved');
  }

  // Method to load settings from environment or database
  async loadSettings(): Promise<void> {
    // This could be implemented to load from a database or .env file
    console.log('Email settings loaded');
  }
}

// Singleton instance
export const emailConfigManager = new EmailConfigManager();

export default EmailConfigManager;
