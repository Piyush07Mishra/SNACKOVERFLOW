'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, QrCode } from "lucide-react";
import { toast } from "sonner";

export function CheckInButton() {
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [checkInUrl, setCheckInUrl] = useState<string>('');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/attendance/status');
        const data = await res.json();
        if (res.ok) {
          setHasActiveSession(!!data.hasActiveSession);
          setCheckInUrl(data.checkInUrl || '');
        }
      } catch (error) {}
      finally {
        setLoadingStatus(false);
      }
    };
    checkStatus();
  }, []);

  const handleOpenAttendance = async () => {
    if (!checkInUrl) {
      toast.error("Unable to open attendance flow right now");
      return;
    }

    setLoading(true);
    try {
      window.location.href = checkInUrl;
    } catch (error) {
      toast.error("Failed to open attendance flow");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant={hasActiveSession ? "secondary" : "default"} 
      size="sm" 
      className="w-full justify-start gap-2 h-9 mb-4"
      disabled={loading || loadingStatus || !checkInUrl}
      onClick={handleOpenAttendance}
    >
      {loading || loadingStatus ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : hasActiveSession ? (
        <LogOut className="h-4 w-4 text-amber-600" />
      ) : (
        <QrCode className="h-4 w-4" />
      )}
      {loadingStatus
        ? "Loading Attendance"
        : hasActiveSession
        ? "Complete Check Out"
        : "Open Check In"}
    </Button>
  );
}
