"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, MapPin, QrCode, ShieldCheck } from 'lucide-react';

type Coords = {
  lat: number;
  lng: number;
  accuracy?: number;
};

type StatusResponse = {
  success?: boolean;
  employeeId?: string;
  hasActiveSession?: boolean;
  alreadyCompletedToday?: boolean;
  checkInUrl?: string;
  activeSession?: {
    checkInTime: string;
    checkInLocation?: {
      lat: number;
      lng: number;
    } | null;
  } | null;
  error?: string;
};

export function AttendanceCheckinClient() {
  const searchParams = useSearchParams();
  const employeeId = (searchParams.get('empId') || '').trim();

  const router = useRouter();
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [location, setLocation] = useState<Coords | null>(null);
  const [geoError, setGeoError] = useState<string>('');

  const actionLabel = status?.hasActiveSession ? 'Check Out' : 'Check In';

  useEffect(() => {
    if (!employeeId) {
      setLoadingStatus(false);
      return;
    }

    const loadStatus = async () => {
      setLoadingStatus(true);
      try {
        const res = await fetch(`/api/attendance/status?empId=${encodeURIComponent(employeeId)}`);
        const data = (await res.json()) as StatusResponse;
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch attendance status');
        }
        setStatus(data);
      } catch (error: any) {
        toast.error(error?.message || 'Failed to load attendance status');
      } finally {
        setLoadingStatus(false);
      }
    };

    loadStatus();
  }, [employeeId, router]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported in this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGeoError('');
      },
      (error) => {
        setGeoError(error.message || 'Unable to read GPS location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const disabledReason = useMemo(() => {
    if (!employeeId) return 'Invalid QR code. Missing employee ID.';
    if (loadingStatus) return 'Loading attendance status...';
    if (status?.alreadyCompletedToday && !status.hasActiveSession) return 'Attendance already completed for today.';
    if (!location) return 'Waiting for GPS permission/location...';
    if (geoError) return geoError;
    return '';
  }, [employeeId, loadingStatus, location, geoError, status]);

  const handleSubmit = async () => {
    if (!employeeId || !location) return;

    setSubmitting(true);
    try {
      const endpoint = status?.hasActiveSession ? '/api/attendance/checkout' : '/api/attendance/checkin';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `${actionLabel} failed`);
      }

      toast.success(data.message || `${actionLabel} successful`);

      if (status?.hasActiveSession) {
        router.push('/dashboard/attendance');
        return;
      }

      const refreshed = await fetch(`/api/attendance/status?empId=${encodeURIComponent(employeeId)}`);
      const refreshedData = (await refreshed.json()) as StatusResponse;
      if (refreshed.ok) {
        setStatus(refreshedData);
      }
    } catch (error: any) {
      toast.error(error?.message || `${actionLabel} failed`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 p-4 md:p-8 flex items-center justify-center">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            <CardTitle>QR Attendance</CardTitle>
          </div>
          <CardDescription>
            Scan QR, capture live GPS, then check in or check out.
          </CardDescription>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="secondary">Employee: {employeeId || 'N/A'}</Badge>
            <Badge variant={status?.hasActiveSession ? 'default' : 'secondary'}>
              {status?.hasActiveSession ? 'ACTIVE session found' : 'No ACTIVE session'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {status?.hasActiveSession && status.activeSession?.checkInTime && (
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium">Current check-in:</p>
              <p>{new Date(status.activeSession.checkInTime).toLocaleString()}</p>
            </div>
          )}

          <div className="rounded-lg border p-3 text-sm space-y-1">
            <div className="flex items-center gap-2 font-medium">
              <MapPin className="h-4 w-4" />
              GPS Status
            </div>
            {location ? (
              <>
                <p>Lat: {location.lat.toFixed(6)}</p>
                <p>Lng: {location.lng.toFixed(6)}</p>
                {typeof location.accuracy === 'number' && (
                  <p>Accuracy: {Math.round(location.accuracy)}m</p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Location not ready.</p>
            )}
            {geoError && <p className="text-red-600">{geoError}</p>}
          </div>

          <div className="rounded-lg border p-3 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="h-4 w-4" />
              Security rules
            </div>
            <p>Logged-in employee must match QR employee ID.</p>
            <p>Check-out only allowed within 500m from check-in location.</p>
          </div>

          <Button
            className="w-full"
            disabled={!!disabledReason || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              actionLabel
            )}
          </Button>

          {status?.alreadyCompletedToday && !status.hasActiveSession ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Attendance already completed for today. <a href="/dashboard/attendance" className="font-semibold underline">Return to dashboard</a>
            </div>
          ) : disabledReason ? (
            <p className="text-xs text-muted-foreground">{disabledReason}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
