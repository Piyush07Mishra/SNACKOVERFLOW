'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      if (!online) {
        setShowOfflineMessage(true);
        toast.warning('You are offline. Some features may be limited.');
      } else {
        setShowOfflineMessage(false);
        toast.success('Connection restored!');
      }
    };

    // Set initial status
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (isOnline && !showOfflineMessage) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Wifi className="h-4 w-4 text-green-600" />
        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
          Online
        </Badge>
      </div>
    );
  }

  return (
    <>
      {!isOnline && (
        <Card className="mx-4 mb-4 border-orange-200 bg-orange-50/50 backdrop-blur-sm">
          <div className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <WifiOff className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-orange-900">You're offline</h3>
                <p className="text-sm text-orange-700 mb-2">
                  Some features may be limited. Cached data is still available.
                </p>
                <Button 
                  onClick={handleRefresh}
                  size="sm"
                  variant="outline"
                  className="text-orange-600 border-orange-200 hover:bg-orange-100"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry Connection
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOfflineMessage(false)}
                className="flex-shrink-0 text-orange-600 hover:text-orange-700"
              >
                ×
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      <div className={`flex items-center gap-2 ${className}`}>
        <WifiOff className="h-4 w-4 text-orange-600" />
        <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
          Offline
        </Badge>
      </div>
    </>
  );
}
