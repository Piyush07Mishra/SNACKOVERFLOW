'use client';

import { useState } from 'react';
import { Download, Smartphone, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'default' | 'sidebar' | 'mobile';
}

export function PWAInstallButton({ 
  className = '',
  variant = 'default'
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isLoading, install, dismiss } = usePWAInstall();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInstall = async () => {
    const success = await install();
    
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  // Don't show if already installed or not installable
  if (isInstalled) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Check className="h-4 w-4 text-green-600" />
        <span className="text-sm text-green-600">Installed</span>
      </div>
    );
  }

  if (!isInstallable) {
    return null;
  }

  // Sidebar variant
  if (variant === 'sidebar') {
    return (
      <Button
        onClick={handleInstall}
        disabled={isLoading || showSuccess}
        className={`w-full justify-start gap-3 ${className}`}
        variant="ghost"
        size="sm"
      >
        {showSuccess ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-green-600">Installed!</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span>Install App</span>
            <Badge variant="secondary" className="ml-auto">
              PWA
            </Badge>
          </>
        )}
      </Button>
    );
  }

  // Mobile variant
  if (variant === 'mobile') {
    return (
      <Button
        onClick={handleInstall}
        disabled={isLoading || showSuccess}
        className={`w-full gap-2 ${className}`}
        size="lg"
      >
        {showSuccess ? (
          <>
            <Check className="h-5 w-5" />
            <span>App Installed!</span>
          </>
        ) : (
          <>
            <Smartphone className="h-5 w-5" />
            <span>
              {isLoading ? 'Installing...' : 'Install EmPay App'}
            </span>
          </>
        )}
      </Button>
    );
  }

  // Default variant
  return (
    <Button
      onClick={handleInstall}
      disabled={isLoading || showSuccess}
      className={`gap-2 ${className}`}
    >
      {showSuccess ? (
        <>
          <Check className="h-4 w-4" />
          <span>Installed!</span>
        </>
      ) : (
        <>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span>{isLoading ? 'Installing...' : 'Install App'}</span>
        </>
      )}
    </Button>
  );
}
