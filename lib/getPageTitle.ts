import { Metadata } from 'next';

interface PageTitleConfig {
  title: string;
  description?: string;
}

// Page title configurations
const pageTitles: Record<string, PageTitleConfig> = {
  // Main pages
  '/': {
    title: 'EmPay - HR Management System',
    description: 'Smart Human Resource Management System for modern businesses'
  },
  '/login': {
    title: 'Login - EmPay',
    description: 'Sign in to your EmPay account'
  },
  '/register': {
    title: 'Register - EmPay',
    description: 'Create your EmPay account'
  },
  
  // Dashboard pages
  '/dashboard': {
    title: 'Dashboard - EmPay',
    description: 'HR Dashboard Overview and Analytics'
  },
  '/dashboard/attendance': {
    title: 'Attendance - EmPay',
    description: 'Manage employee attendance and time tracking'
  },
  '/dashboard/directory': {
    title: 'Employee Directory - EmPay',
    description: 'Browse and search employee profiles'
  },
  '/dashboard/payroll': {
    title: 'Payroll - EmPay',
    description: 'Manage payroll processing and salary information'
  },
  '/dashboard/timeoff': {
    title: 'Time Off - EmPay',
    description: 'Request and manage leave and time off'
  },
  '/dashboard/profile': {
    title: 'Profile - EmPay',
    description: 'Manage your profile and personal information'
  },
  '/dashboard/settings': {
    title: 'Settings - EmPay',
    description: 'Account settings and preferences'
  },
  
  // Settings sub-pages
  '/dashboard/settings/email': {
    title: 'Email Settings - EmPay',
    description: 'Configure email notifications and templates'
  },
  
  // Auth pages
  '/auth/forgot-password': {
    title: 'Forgot Password - EmPay',
    description: 'Reset your password'
  },
  '/auth/reset-password': {
    title: 'Reset Password - EmPay',
    description: 'Create a new password'
  }
};

/**
 * Get page title and metadata based on pathname
 */
export function getPageTitle(pathname: string): PageTitleConfig {
  // Exact match first
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }
  
  // Handle dynamic routes (e.g., /dashboard/profile/[userId])
  const dynamicRoutes = [
    {
      pattern: /^\/dashboard\/profile/,
      title: 'Profile - EmPay',
      description: 'Manage your profile and personal information'
    },
    {
      pattern: /^\/dashboard\/settings\/.*/,
      title: 'Settings - EmPay',
      description: 'Account settings and preferences'
    }
  ];
  
  for (const route of dynamicRoutes) {
    if (route.pattern.test(pathname)) {
      return {
        title: route.title,
        description: route.description
      };
    }
  }
  
  // Default fallback
  return {
    title: 'EmPay - HR Management System',
    description: 'Smart Human Resource Management System for modern businesses'
  };
}

/**
 * Generate Next.js metadata object
 */
export function generateMetadata(pathname: string): Metadata {
  const pageTitle = getPageTitle(pathname);
  
  return {
    title: pageTitle.title,
    description: pageTitle.description,
    openGraph: {
      title: pageTitle.title,
      description: pageTitle.description,
      type: 'website',
      siteName: 'EmPay',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle.title,
      description: pageTitle.description,
    },
    robots: {
      index: true,
      follow: true,
    },
    keywords: ['HR', 'Human Resources', 'Payroll', 'Attendance', 'Employee Management'],
    authors: [{ name: 'EmPay Team' }],
    viewport: 'width=device-width, initial-scale=1',
  };
}

/**
 * Get page title without suffix for dynamic content
 */
export function getBasePageTitle(pathname: string): string {
  const pageTitle = getPageTitle(pathname);
  return pageTitle.title.replace(' - EmPay', '');
}

/**
 * Generate dynamic title with user context
 */
export function generateDynamicTitle(
  pathname: string, 
  context?: {
    userName?: string;
    employeeId?: string;
    department?: string;
    role?: string;
    customTitle?: string;
  }
): string {
  const baseTitle = getBasePageTitle(pathname);
  
  if (context?.customTitle) {
    return `${context.customTitle} - EmPay`;
  }
  
  if (context?.userName) {
    return `${baseTitle}: ${context.userName} - EmPay`;
  }
  
  if (context?.employeeId) {
    return `${baseTitle}: ${context.employeeId} - EmPay`;
  }
  
  if (context?.department) {
    return `${baseTitle} - ${context.department} - EmPay`;
  }
  
  return `${baseTitle} - EmPay`;
}
