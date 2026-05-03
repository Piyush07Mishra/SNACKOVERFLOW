'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface DynamicPageTitleProps {
  userName?: string;
  employeeId?: string;
  department?: string;
  role?: string;
  customTitle?: string;
}

export function DynamicPageTitle({ 
  userName, 
  employeeId, 
  department, 
  role, 
  customTitle 
}: DynamicPageTitleProps) {
  const pathname = usePathname();

  useEffect(() => {
    const updatePageTitle = () => {
      const baseTitle = getBasePageTitle(pathname);
      
      if (customTitle) {
        document.title = `${customTitle} - EmPay`;
      } else if (userName) {
        document.title = `${baseTitle}: ${userName} - EmPay`;
      } else if (employeeId) {
        document.title = `${baseTitle}: ${employeeId} - EmPay`;
      } else if (department) {
        document.title = `${baseTitle} - ${department} - EmPay`;
      } else {
        document.title = `${baseTitle} - EmPay`;
      }
    };

    updatePageTitle();
  }, [pathname, userName, employeeId, department, customTitle]);

  // Helper function to get base page title
  function getBasePageTitle(pathname: string): string {
    const pageTitles: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/dashboard/attendance': 'Attendance',
      '/dashboard/directory': 'Employee Directory',
      '/dashboard/payroll': 'Payroll',
      '/dashboard/timeoff': 'Time Off',
      '/dashboard/profile': 'Profile',
      '/dashboard/settings': 'Settings',
      '/dashboard/settings/email': 'Email Settings',
    };

    // Exact match first
    if (pageTitles[pathname]) {
      return pageTitles[pathname];
    }
    
    // Handle dynamic routes
    if (pathname.startsWith('/dashboard/profile')) {
      return 'Profile';
    }
    if (pathname.startsWith('/dashboard/settings/')) {
      return 'Settings';
    }
    
    return 'EmPay';
  }

  // This component doesn't render anything visible
  return null;
}
