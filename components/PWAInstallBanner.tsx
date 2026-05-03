'use client';

import { useState } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { toast } from 'sonner';

interface PWAInstallBannerProps {
  className?: string;
}

export function PWAInstallBanner({ className }: PWAInstallBannerProps) {
  const { isInstallable, isInstalled, isLoading, install, dismiss } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if already installed, not installable, or dismissed
  if (isInstalled || !isInstallable || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    const success = await install();
    
    if (success) {
      toast.success('EmPay installed successfully!');
    } else {
      toast.info('Installation cancelled');
    }
  };

  const handleDismiss = () => {
    dismiss();
    setDismissed(true);
    // Store dismissal in localStorage for this session
    if (typeof window !== 'undefined') {
      localStorage.setItem('pwa-banner-dismissed', 'true');
    }
  };

  return (
    <Card className={`mx-4 mb-4 border-blue-200 bg-blue-50/50 backdrop-blur-sm ${className}`}>
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Smartphone className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-blue-900">Install EmPay</h3>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                PWA
              </Badge>
            </div>
            
            <p className="text-sm text-blue-700 mb-3">
              Install EmPay on your device for quick access, offline support, and a native app experience.
            </p>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={handleInstall}
                disabled={isLoading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  'Installing...'
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    Install App
                  </>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDismiss}
                className="text-blue-600 hover:text-blue-700"
              >
                <X className="h-4 w-4 mr-1" />
                Not now
              </Button>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
