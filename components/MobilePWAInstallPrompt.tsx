'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Apple, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface MobilePWAInstallPromptProps {
  className?: string;
}

export function MobilePWAInstallPrompt({ className = '' }: MobilePWAInstallPromptProps) {
  const { isInstallable, isInstalled, isLoading, install, dismiss } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Detect device type
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Show prompt after user interaction (not immediately)
    const timer = setTimeout(() => {
      if (!isInstalled && isInstallable) {
        setIsVisible(true);
      }
    }, 3000); // Show after 3 seconds

    return () => clearTimeout(timer);
  }, [isInstalled, isInstallable]);

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    dismiss();
  };

  // Don't show if already installed or not installable
  if (isInstalled || !isInstallable || !isVisible) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}>
      <Card className="bg-background/95 backdrop-blur-sm border-2 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-sm">Install EmPay App</h3>
                <Badge variant="secondary" className="text-xs">PWA</Badge>
              </div>
              
              <p className="text-xs text-muted-foreground mb-3">
                {isIOS 
                  ? "Add EmPay to your home screen for quick access!"
                  : isAndroid 
                  ? "Install EmPay as a native app on your device!"
                  : "Install EmPay for offline access and better experience!"
                }
              </p>

              {!showInstructions ? (
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleInstall}
                    disabled={isLoading}
                    className="w-full gap-2"
                    size="sm"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span>Installing...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Install Now</span>
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInstructions(true)}
                    className="text-xs"
                  >
                    How to install manually
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {isIOS ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Apple className="h-4 w-4" />
                        <span className="font-medium">iOS Installation:</span>
                      </div>
                      <ol className="space-y-1 ml-6">
                        <li>1. Tap Share icon <span className="inline-block">□↑</span></li>
                        <li>2. Select "Add to Home Screen"</li>
                        <li>3. Tap "Add" to confirm</li>
                      </ol>
                    </div>
                  ) : isAndroid ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Chrome className="h-4 w-4" />
                        <span className="font-medium">Android Installation:</span>
                      </div>
                      <ol className="space-y-1 ml-6">
                        <li>1. Tap menu icon <span className="inline-block">⋮</span></li>
                        <li>2. Select "Add to Home screen"</li>
                        <li>3. Tap "Add" to confirm</li>
                      </ol>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <ol className="space-y-1 ml-6">
                        <li>1. Click the install button above</li>
                        <li>2. Follow your browser's instructions</li>
                        <li>3. App will appear on your home screen</li>
                      </ol>
                    </div>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInstructions(false)}
                    className="text-xs w-full"
                  >
                    Back to install button
                  </Button>
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
