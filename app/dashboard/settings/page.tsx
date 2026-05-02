'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { KeyRound, ShieldCheck, Loader2, AlertCircle, Building2, CreditCard, Landmark } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [bankLoading, setBankLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [bankData, setBankData] = useState({
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
  });

  useEffect(() => {
    const fetchBankDetails = async () => {
      try {
        const res = await fetch('/api/user/bank-details');
        const data = await res.json();
        if (data) setBankData(data);
      } catch (error) { }
    };
    fetchBankDetails();
  }, []);

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankLoading(true);
    try {
      const res = await fetch('/api/user/bank-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankData),
      });

      if (res.ok) {
        toast.success("Bank details updated successfully");
      } else {
        toast.error("Failed to update bank details");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setBankLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Password updated successfully");
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.error || "Failed to update password");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account security and banking preferences.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Password Card */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden h-fit">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your security credentials.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  required
                  className="bg-background/50 border-border/50"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  required
                  className="bg-background/50 border-border/50"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  className="bg-background/50 border-border/50"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t border-border/50 py-4 mt-4">
              <Button type="submit" disabled={loading} className="w-full gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Update Password
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Bank Details Card */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden h-fit">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 via-blue-500 to-blue-500/50" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle>Bank Details</CardTitle>
                <CardDescription>Where your salary will be credited.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <form onSubmit={handleBankSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <div className="relative">
                  <Landmark className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="bankName"
                    placeholder="e.g. HDFC Bank"
                    className="pl-9 bg-background/50 border-border/50"
                    value={bankData.bankName}
                    onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="accountNumber"
                    placeholder="000000000000"
                    className="pl-9 bg-background/50 border-border/50"
                    value={bankData.accountNumber}
                    onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    placeholder="HDFC0000..."
                    className="bg-background/50 border-border/50"
                    value={bankData.ifscCode}
                    onChange={(e) => setBankData({ ...bankData, ifscCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branchName">Branch</Label>
                  <Input
                    id="branchName"
                    placeholder="e.g. Downtown"
                    className="bg-background/50 border-border/50"
                    value={bankData.branchName}
                    onChange={(e) => setBankData({ ...bankData, branchName: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t border-border/50 py-4 mt-4">
              <Button type="submit" disabled={bankLoading} className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                {bankLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                Save Bank Details
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
