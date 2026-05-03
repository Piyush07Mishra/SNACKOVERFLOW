'use client';

import { useState } from 'react';
import { Bell, BellOff, Check, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface PushNotificationSettingsProps {
  className?: string;
}

export function PushNotificationSettings({ className }: PushNotificationSettingsProps) {
  const {
    isSupported,
    permission,
    subscription,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    testNotification
  } = usePushNotifications();

  const [notificationTypes, setNotificationTypes] = useState({
    attendance: true,
    leave: true,
    payroll: true,
    system: true,
    reminder: true,
    approval: true
  });

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      toast.success('Push notifications enabled successfully!');
    }
  };

  const handleUnsubscribe = async () => {
    const success = await unsubscribe();
    if (success) {
      toast.success('Push notifications disabled');
    }
  };

  const handleTestNotification = async () => {
    await testNotification();
  };

  const handleNotificationTypeToggle = (type: keyof typeof notificationTypes) => {
    setNotificationTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  if (!isSupported) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center gap-3 text-muted-foreground">
          <BellOff className="h-5 w-5" />
          <div>
            <h3 className="font-medium">Push Notifications Not Supported</h3>
            <p className="text-sm">Your browser doesn't support push notifications. Please try using a modern browser like Chrome, Firefox, or Edge.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Push Notification Settings</h3>
          </div>
          {subscription && (
            <Badge variant="default" className="bg-green-500">
              <Check className="h-3 w-3 mr-1" />
              Active
            </Badge>
          )}
        </div>

        {/* Permission Status */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            {permission === 'granted' ? (
              <Bell className="h-5 w-5 text-green-600" />
            ) : permission === 'denied' ? (
              <X className="h-5 w-5 text-red-600" />
            ) : (
              <BellOff className="h-5 w-5 text-yellow-600" />
            )}
            <div>
              <p className="font-medium">
                Permission Status: <span className="capitalize">{permission}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {permission === 'granted' 
                  ? 'Push notifications are enabled'
                  : permission === 'denied'
                  ? 'Push notifications are blocked. Please enable them in your browser settings.'
                  : 'Permission not requested yet'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Actions */}
        <div className="flex flex-col gap-3">
          {!subscription ? (
            <Button 
              onClick={handleSubscribe}
              disabled={isLoading || permission === 'denied'}
              className="w-full"
            >
              {isLoading ? 'Enabling...' : 'Enable Push Notifications'}
            </Button>
          ) : (
            <div className="space-y-3">
              <Button 
                onClick={handleTestNotification}
                variant="outline"
                className="w-full"
              >
                Send Test Notification
              </Button>
              <Button 
                onClick={handleUnsubscribe}
                variant="destructive"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Disabling...' : 'Disable Push Notifications'}
              </Button>
            </div>
          )}
        </div>

        {/* Notification Type Preferences */}
        {subscription && (
          <div className="space-y-4">
            <h4 className="font-medium">Notification Types</h4>
            <div className="space-y-3">
              {Object.entries(notificationTypes).map(([type, enabled]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="capitalize">{type}</span>
                    <p className="text-sm text-muted-foreground">
                      {type === 'attendance' && 'Check-in/out reminders'}
                      {type === 'leave' && 'Leave request updates'}
                      {type === 'payroll' && 'Payroll processing notifications'}
                      {type === 'system' && 'System announcements'}
                      {type === 'reminder' && 'General reminders'}
                      {type === 'approval' && 'Approval notifications'}
                    </p>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={() => handleNotificationTypeToggle(type as keyof typeof notificationTypes)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Browser Instructions */}
        {permission === 'denied' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">How to Enable Push Notifications</h4>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Click the lock icon in your browser's address bar</li>
              <li>2. Find "Notifications" in the permissions list</li>
              <li>3. Change the setting from "Block" to "Allow"</li>
              <li>4. Refresh this page and try again</li>
            </ol>
          </div>
        )}
      </div>
    </Card>
  );
}
