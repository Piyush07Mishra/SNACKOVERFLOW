"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, CheckCircle, XCircle, Clock, Settings, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface EmailLog {
  id: string;
  to: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
  sentAt?: Date;
  createdAt: Date;
  messageId?: string;
}

interface EmailStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  successRate: string;
}

interface EmailSettingsClientProps {
  initialLogs: EmailLog[];
  initialStats: EmailStats;
}

export default function EmailSettingsClient({ initialLogs, initialStats }: EmailSettingsClientProps) {
  const [logs, setLogs] = useState<EmailLog[]>(initialLogs);
  const [stats, setStats] = useState<EmailStats>(initialStats);
  const [isLoading, setIsLoading] = useState(false);

  const [emailConfig, setEmailConfig] = useState({
    enabled: true,
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: '',
        pass: ''
      },
      from: {
        name: 'EmPay HR System',
        address: 'noreply@emprepay.com'
      }
    },
    notifications: {
      leaveApproval: true,
      leaveRequest: false,
      payrollProcessed: false,
      payrollApproval: false,
      welcomeEmail: false,
      passwordReset: false
    }
  });

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailConfig.smtp)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Email connection test successful!');
      } else {
        toast.error(`Email connection test failed: ${result.error}`);
      }
    } catch (error) {
      toast.error('Failed to test email connection');
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestEmail = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/email/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailConfig.smtp.auth.user,
          subject: 'Test Email from EmPay HR System',
          message: 'This is a test email to verify your email configuration.'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Test email sent successfully!');
        // Refresh logs
        refreshLogs();
      } else {
        toast.error(`Failed to send test email: ${result.error}`);
      }
    } catch (error) {
      toast.error('Failed to send test email');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshLogs = async () => {
    try {
      const response = await fetch('/api/settings/email/logs');
      const data = await response.json();
      setLogs(data.logs);
      setStats(data.stats);
    } catch (error) {
      toast.error('Failed to refresh email logs');
    }
  };

  const clearLogs = async () => {
    try {
      const response = await fetch('/api/settings/email/logs', {
        method: 'DELETE'
      });

      if (response.ok) {
        setLogs([]);
        setStats({ total: 0, sent: 0, failed: 0, pending: 0, successRate: '0' });
        toast.success('Email logs cleared successfully');
      }
    } catch (error) {
      toast.error('Failed to clear email logs');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      sent: 'default',
      failed: 'destructive',
      pending: 'secondary'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Email Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="logs">Email Logs</TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
              <CardDescription>
                Configure your SMTP server settings for sending emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    value={emailConfig.smtp.host}
                    onChange={(e) => setEmailConfig(prev => ({
                      ...prev,
                      smtp: { ...prev.smtp, host: e.target.value }
                    }))}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={emailConfig.smtp.port}
                    onChange={(e) => setEmailConfig(prev => ({
                      ...prev,
                      smtp: { ...prev.smtp, port: parseInt(e.target.value) }
                    }))}
                    placeholder="587"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp-user">Username</Label>
                  <Input
                    id="smtp-user"
                    value={emailConfig.smtp.auth.user}
                    onChange={(e) => setEmailConfig(prev => ({
                      ...prev,
                      smtp: { 
                        ...prev.smtp, 
                        auth: { ...prev.smtp.auth, user: e.target.value }
                      }
                    }))}
                    placeholder="your-email@gmail.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp-pass">Password</Label>
                  <Input
                    id="smtp-pass"
                    type="password"
                    value={emailConfig.smtp.auth.pass}
                    onChange={(e) => setEmailConfig(prev => ({
                      ...prev,
                      smtp: { 
                        ...prev.smtp, 
                        auth: { ...prev.smtp.auth, pass: e.target.value }
                      }
                    }))}
                    placeholder="your-app-password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="from-name">From Name</Label>
                  <Input
                    id="from-name"
                    value={emailConfig.smtp.from.name}
                    onChange={(e) => setEmailConfig(prev => ({
                      ...prev,
                      smtp: { 
                        ...prev.smtp, 
                        from: { ...prev.smtp.from, name: e.target.value }
                      }
                    }))}
                    placeholder="EmPay HR System"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="from-address">From Address</Label>
                  <Input
                    id="from-address"
                    value={emailConfig.smtp.from.address}
                    onChange={(e) => setEmailConfig(prev => ({
                      ...prev,
                      smtp: { 
                        ...prev.smtp, 
                        from: { ...prev.smtp.from, address: e.target.value }
                      }
                    }))}
                    placeholder="noreply@emprepay.com"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="smtp-secure"
                  checked={emailConfig.smtp.secure}
                  onCheckedChange={(checked) => setEmailConfig(prev => ({
                    ...prev,
                    smtp: { ...prev.smtp, secure: checked }
                  }))}
                />
                <Label htmlFor="smtp-secure">Use SSL/TLS</Label>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={testConnection} disabled={isLoading}>
                  {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
                  Test Connection
                </Button>
                <Button variant="outline" onClick={sendTestEmail} disabled={isLoading}>
                  {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Test Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Only leave approval emails are enabled
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="notify-leaveApproval">Leave Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email to employees when their leave request is approved or rejected
                  </p>
                </div>
                <Switch
                  id="notify-leaveApproval"
                  checked={emailConfig.notifications.leaveApproval}
                  onCheckedChange={(checked) => setEmailConfig(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, leaveApproval: checked }
                  }))}
                />
              </div>
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> All other email notifications (leave requests, payroll, welcome emails, password resets) have been disabled for privacy and performance reasons.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Email Logs</CardTitle>
                  <CardDescription>
                    View the history of sent emails
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={refreshLogs}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearLogs}>
                    Clear Logs
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No email logs found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className="font-medium">{log.subject}</span>
                          {getStatusBadge(log.status)}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>To: {log.to}</p>
                        {log.messageId && <p>Message ID: {log.messageId}</p>}
                        {log.error && <p className="text-red-600">Error: {log.error}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getNotificationDescription(key: string): string {
  const descriptions = {
    leaveApproval: "Send email to employees when their leave request is approved or rejected",
    leaveRequest: "Send email to managers when employees submit leave requests",
    payrollProcessed: "Send email to employees when their payroll is processed",
    payrollApproval: "Send email to managers when payroll requires approval",
    welcomeEmail: "Send welcome email to new employees with their login credentials",
    passwordReset: "Send password reset emails to employees"
  };

  return descriptions[key as keyof typeof descriptions] || "";
}
