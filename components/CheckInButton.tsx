'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Clock, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function CheckInButton() {
  const [loading, setLoading] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/attendance/status');
        const data = await res.json();
        if (data.present) setCheckedIn(true);
      } catch (error) {}
    };
    checkStatus();
  }, []);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/attendance/checkin', {
        method: 'POST',
      });
      const data = await res.json();
      
      if (res.ok) {
        setCheckedIn(true);
        toast.success("Checked in successfully!");
      } else {
        toast.error(data.error || "Failed to check in");
      }
    } catch (error) {
      toast.error("An error occurred during check-in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant={checkedIn ? "secondary" : "default"} 
      size="sm" 
      className="w-full justify-start gap-2 h-9 mb-4"
      disabled={loading || checkedIn}
      onClick={handleCheckIn}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : checkedIn ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
      {checkedIn ? "Checked In Today" : "Check In Now"}
    </Button>
  );
}
