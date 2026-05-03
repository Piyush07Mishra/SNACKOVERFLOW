# Attendance Check-In / Check-Out Feature

This document describes the complete QR-based attendance feature, including database schema, backend API routes, UI pages/components, and the full data flow.

## Overview

Employees can check in and check out using a personalized QR code URL. The system tracks both an active session and a daily attendance record.

Key flows:
- Employee opens the dashboard and gets a QR check-in link.
- Employee scans the QR code and lands on `/attendance/checkin?empId=<employeeId>`.
- The front-end fetches current attendance status and obtains GPS location.
- The same page is used for both check-in and check-out.
- Checkout is only allowed within 500 meters of the recorded check-in location.

## Files involved

- `lib/models/Attendance.ts`
- `lib/models/AttendanceSession.ts`
- `lib/geo.ts`
- `app/api/attendance/status/route.ts`
- `app/api/attendance/checkin/route.ts`
- `app/api/attendance/checkout/route.ts`
- `app/dashboard/attendance/page.tsx`
- `app/dashboard/attendance/client.tsx`
- `app/attendance/checkin/page.tsx`
- `app/attendance/checkin/ui-client.tsx`

---

## Database models

### `lib/models/Attendance.ts`

This model stores one attendance record per user per day. It tracks check-in, check-out, total working hours, breaks, and notes.

```ts
import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    employeeId: { type: String, default: '' },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Half_Day'],
      default: 'Present',
    },
    checkIn: { type: Date },
    checkOut: { type: Date },
    timerStartTime: { type: Date },
    breaks: [
      {
        start: { type: Date },
        end: { type: Date },
      },
    ],
    notes: { type: String, default: '' },
    totalWorkingHours: { type: Number, default: 0 },
  },
  { timestamps: true }
);

AttendanceSchema.index({ user: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ companyId: 1, date: 1 });

export const Attendance =
  mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
```

### `lib/models/AttendanceSession.ts`

This model stores an active attendance session. It is used to enforce one active check-in session at a time and to validate checkout location.

```ts
import mongoose from 'mongoose';

const LocationSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    accuracy: { type: Number, default: null },
  },
  { _id: false }
);

const AttendanceSessionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    employeeId: { type: String, required: true, index: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    checkInTime: { type: Date, required: true },
    checkOutTime: { type: Date, default: null },
    checkInLocation: { type: LocationSchema, required: true },
    checkOutLocation: { type: LocationSchema, default: null },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  { timestamps: true }
);

AttendanceSessionSchema.index(
  { companyId: 1, employeeId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'ACTIVE' },
  }
);

AttendanceSessionSchema.index({ companyId: 1, employeeId: 1, createdAt: -1 });

export const AttendanceSession =
  mongoose.models.AttendanceSession ||
  mongoose.model('AttendanceSession', AttendanceSessionSchema);
```

---

## Geo utility

### `lib/geo.ts`

This helper calculates the distance between two latitude/longitude coordinates in meters using the Haversine formula.

```ts
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

---

## Backend API routes

### `app/api/attendance/status/route.ts`

This route returns the current attendance state for the logged-in employee. It checks both the daily `Attendance` record and any active `AttendanceSession`.

```ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Attendance } from '@/lib/models/Attendance';
import { AttendanceSession } from '@/lib/models/AttendanceSession';
import { User } from '@/lib/models/User';
import { auth } from '@/auth';
import { format } from 'date-fns';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const url = new URL(req.url);
    const empIdFromQuery = url.searchParams.get('empId')?.trim();

    const currentUser = await User.findById(session.user.id).select('_id companyId employeeId role').lean();
    if (!currentUser?.companyId || !currentUser.employeeId) {
      return NextResponse.json({ error: 'User profile is incomplete' }, { status: 400 });
    }
    if (currentUser.role !== 'Employee') {
      return NextResponse.json({ error: 'Only employees can view attendance status' }, { status: 403 });
    }

    if (empIdFromQuery && empIdFromQuery !== currentUser.employeeId) {
      return NextResponse.json({ error: 'Wrong QR for this user' }, { status: 403 });
    }

    const employeeId = empIdFromQuery || currentUser.employeeId;
    const today = format(new Date(), 'yyyy-MM-dd');

    const existing = await Attendance.findOne({
      user: currentUser._id,
      date: today
    });

    const activeSession = await AttendanceSession.findOne({
      companyId: currentUser.companyId,
      employeeId,
      userId: currentUser._id,
      status: 'ACTIVE',
    }).lean();

    const alreadyCompletedToday = !!existing?.checkOut;
    const checkInUrl = `${url.origin}/attendance/checkin?empId=${encodeURIComponent(employeeId)}`;

    return NextResponse.json({
      success: true,
      employeeId,
      present: !!existing,
      hasActiveSession: !!activeSession,
      alreadyCompletedToday,
      activeSession: activeSession
        ? {
            id: activeSession._id,
            checkInTime: activeSession.checkInTime,
            checkInLocation: activeSession.checkInLocation || null,
          }
        : null,
      checkInUrl,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

### `app/api/attendance/checkin/route.ts`

This route validates user identity, prevents duplicate check-ins, and creates both an active `AttendanceSession` and a daily `Attendance` record.

```ts
import dbConnect from '@/lib/mongodb';
import { Attendance } from '@/lib/models/Attendance';
import { AttendanceSession } from '@/lib/models/AttendanceSession';
import { User } from '@/lib/models/User';
import { auth } from '@/auth';
import { format } from 'date-fns';
import { rateLimit, setSecurityHeaders, createErrorResponse, createSuccessResponse } from '@/lib/security';

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    const response = createErrorResponse('Unauthorized', 401);
    return setSecurityHeaders(response);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { employeeId, lat, lng, accuracy } = body as {
      employeeId?: string;
      lat?: number;
      lng?: number;
      accuracy?: number;
    };

    const clientIP = getClientIP(req);
    if (!rateLimit(`checkin:${session.user.id}`, 10, 60 * 60 * 1000)) {
      const response = createErrorResponse('Too many check-in attempts. Please try again later.', 429);
      return setSecurityHeaders(response);
    }

    await dbConnect();
    const currentUser = await User.findById(session.user.id)
      .select('_id companyId employeeId role')
      .lean();
    if (!currentUser?.companyId || !currentUser.employeeId) {
      const response = createErrorResponse('User profile is incomplete', 400);
      return setSecurityHeaders(response);
    }
    if (currentUser.role !== 'Employee') {
      const response = createErrorResponse('Only employees can use attendance check-in', 403);
      return setSecurityHeaders(response);
    }

    const payloadEmployeeId = employeeId?.trim() || currentUser.employeeId;
    if (payloadEmployeeId !== currentUser.employeeId) {
      const response = createErrorResponse('Wrong QR for this user', 403);
      return setSecurityHeaders(response);
    }

    if (
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 || lat > 90 ||
      lng < -180 || lng > 180
    ) {
      const response = createErrorResponse('employeeId, lat, lng are required', 400);
      return setSecurityHeaders(response);
    }

    const today = format(new Date(), 'yyyy-MM-dd');

    const existingAttendance = await Attendance.findOne({
      user: currentUser._id,
      date: today,
    });

    if (existingAttendance) {
      if (existingAttendance.checkOut) {
        const response = createErrorResponse('You have already completed attendance for today.', 400);
        return setSecurityHeaders(response);
      }
      const response = createErrorResponse('You are already checked in for today.', 400);
      return setSecurityHeaders(response);
    }

    const activeSession = await AttendanceSession.findOne({
      companyId: currentUser.companyId,
      employeeId: payloadEmployeeId,
      userId: currentUser._id,
      status: 'ACTIVE',
    });

    if (activeSession) {
      const response = createErrorResponse('Already checked in. Active session exists.', 400);
      return setSecurityHeaders(response);
    }

    const now = new Date();

    const attendanceSession = await AttendanceSession.create({
      companyId: currentUser.companyId,
      employeeId: payloadEmployeeId,
      userId: currentUser._id,
      checkInTime: now,
      checkInLocation: {
        lat,
        lng,
        accuracy: typeof accuracy === 'number' ? accuracy : null,
      },
      status: 'ACTIVE',
    });

    await Attendance.create({
      companyId: currentUser.companyId,
      employeeId: payloadEmployeeId,
      user: currentUser._id,
      date: today,
      status: 'Present',
      checkIn: now,
      timerStartTime: now,
    });

    const response = createSuccessResponse({ 
      success: true,
      sessionId: attendanceSession._id,
      employeeId: payloadEmployeeId,
      checkInTime: attendanceSession.checkInTime,
      message: 'Checked in successfully',
    });
    return setSecurityHeaders(response);

  } catch (error: any) {
    console.error('Check-in error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userId: session?.user?.id
    });
    
    const response = createErrorResponse('Internal Server Error', 500);
    return setSecurityHeaders(response);
  }
}
```

### `app/api/attendance/checkout/route.ts`

This route validates the checkout location, completes the session, and updates the daily attendance record.

```ts
import { format, differenceInMinutes } from 'date-fns';
import dbConnect from '@/lib/mongodb';
import { auth } from '@/auth';
import { User } from '@/lib/models/User';
import { Attendance } from '@/lib/models/Attendance';
import { AttendanceSession } from '@/lib/models/AttendanceSession';
import { getDistanceMeters } from '@/lib/geo';
import { createErrorResponse, createSuccessResponse, setSecurityHeaders } from '@/lib/security';

const MAX_CHECKOUT_DISTANCE_METERS = 500;

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
}

function isValidCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return setSecurityHeaders(createErrorResponse('Unauthorized', 401));
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { employeeId, lat, lng, accuracy } = body as {
      employeeId?: string;
      lat?: number;
      lng?: number;
      accuracy?: number;
    };

    if (!employeeId || !isValidCoordinate(lat, -90, 90) || !isValidCoordinate(lng, -180, 180)) {
      return setSecurityHeaders(createErrorResponse('employeeId, lat, lng are required', 400));
    }

    await dbConnect();

    const currentUser = await User.findById(session.user.id).select('_id companyId employeeId role').lean();
    if (!currentUser?.companyId || !currentUser.employeeId) {
      return setSecurityHeaders(createErrorResponse('User profile is incomplete', 400));
    }
    if (currentUser.role !== 'Employee') {
      return setSecurityHeaders(createErrorResponse('Only employees can use attendance check-out', 403));
    }

    if (currentUser.employeeId !== employeeId) {
      return setSecurityHeaders(createErrorResponse('Wrong QR for this user', 403));
    }

    const activeSession = await AttendanceSession.findOne({
      companyId: currentUser.companyId,
      employeeId,
      userId: currentUser._id,
      status: 'ACTIVE',
    });

    if (!activeSession) {
      return setSecurityHeaders(createErrorResponse('No active check-in session found', 400));
    }

    const distanceMeters = getDistanceMeters(
      activeSession.checkInLocation.lat,
      activeSession.checkInLocation.lng,
      lat,
      lng
    );

    if (distanceMeters > MAX_CHECKOUT_DISTANCE_METERS) {
      return setSecurityHeaders(
        createErrorResponse(
          `Checkout denied. Distance from check-in location is ${Math.round(distanceMeters)}m (max ${MAX_CHECKOUT_DISTANCE_METERS}m).`,
          400
        )
      );
    }

    const now = new Date();
    activeSession.checkOutTime = now;
    activeSession.checkOutLocation = { lat, lng, accuracy: typeof accuracy === 'number' ? accuracy : null };
    activeSession.status = 'COMPLETED';
    await activeSession.save();

    const checkInDate = format(new Date(activeSession.checkInTime), 'yyyy-MM-dd');
    const attendance = await Attendance.findOne({ user: currentUser._id, date: checkInDate });
    if (attendance && !attendance.checkOut) {
      attendance.checkOut = now;
      let totalMinutes = differenceInMinutes(now, attendance.checkIn);
      let breakMinutes = 0;
      if (attendance.breaks?.length) {
        attendance.breaks.forEach((b: any) => {
          if (b.start && b.end) {
            breakMinutes += differenceInMinutes(b.end, b.start);
          } else if (b.start && !b.end) {
            b.end = now;
            breakMinutes += differenceInMinutes(now, b.start);
          }
        });
      }
      attendance.totalWorkingHours = Math.max((totalMinutes - breakMinutes) / 60, 0);
      await attendance.save();
    }

    return setSecurityHeaders(
      createSuccessResponse({
        success: true,
        employeeId,
        checkOutTime: now,
        distanceMeters: Math.round(distanceMeters),
        message: 'Checked out successfully',
      })
    );
  } catch (error: any) {
    console.error('Checkout error:', {
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      userId: session.user.id,
      ip: getClientIP(req),
    });
    return setSecurityHeaders(createErrorResponse('Internal Server Error', 500));
  }
}
```

---

## UI pages and components

### `app/dashboard/attendance/page.tsx`

This server component prepares dashboard data and generates the employee QR attendance link.

```tsx
import dbConnect from '@/lib/mongodb';
import { Attendance } from '@/lib/models/Attendance';
import { AttendanceSession } from '@/lib/models/AttendanceSession';
import { User } from '@/lib/models/User';
import { auth } from '@/auth';
import { AttendanceClient } from './client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import QRCode from 'qrcode';

export default async function AttendancePage() {
  const session = await auth();
  const userId = session?.user?.id;
  const userRole = (session?.user as any)?.role;

  await dbConnect();
  
  const today = format(new Date(), 'yyyy-MM-dd');
  let attendanceRecords = [];
  let todayRecord = null;
  let checkInUrl: string | null = null;
  let qrDataUrl: string | null = null;
  let hasActiveSession = false;

  const isAdminOrOfficer = ['Admin', 'HR_Officer', 'Payroll_Officer'].includes(userRole);

  if (!isAdminOrOfficer && userId) {
    const currentUser = await User.findById(userId).select('employeeId companyId').lean();
    const employeeId = currentUser?.employeeId || '';
    if (employeeId) {
      checkInUrl = `/attendance/checkin?empId=${encodeURIComponent(employeeId)}`;
      const origin = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      qrDataUrl = await QRCode.toDataURL(`${origin}${checkInUrl}`);
      hasActiveSession = !!(await AttendanceSession.findOne({
        companyId: currentUser.companyId,
        employeeId,
        status: 'ACTIVE',
      }).lean());
    }
  }

  if (isAdminOrOfficer) {
    const companyId = (session?.user as any)?.companyId;
    const employees = await User.find({ companyId, role: { $ne: 'Admin' } })
      .select('name email employeeId')
      .lean();

    const todayAttendance = await Attendance.find({ date: today, companyId })
      .select('user status checkIn checkOut totalWorkingHours breaks notes employeeId')
      .lean();

    const attendanceByUser = new Map(todayAttendance.map((record: any) => [record.user.toString(), record]));

    attendanceRecords = employees.map((employee) => {
      const attendance = attendanceByUser.get(employee._id.toString());
      return {
        _id: attendance?._id || employee._id,
        user: employee,
        employeeId: employee.employeeId,
        date: today,
        status: attendance?.status || 'Absent',
        checkIn: attendance?.checkIn || null,
        checkOut: attendance?.checkOut || null,
        totalWorkingHours: attendance?.totalWorkingHours || 0,
        breaks: attendance?.breaks || [],
        notes: attendance?.notes || '',
      };
    });
  } else {
    const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const end = format(endOfMonth(new Date()), 'yyyy-MM-dd');
    
    attendanceRecords = await Attendance.find({
      user: userId,
      date: { $gte: start, $lte: end }
    })
    .sort({ date: -1 })
    .lean();

    todayRecord = await Attendance.findOne({ user: userId, date: today }).lean();
  }

  const serializedRecords = attendanceRecords.map((record: any) => ({
    id: record._id.toString(),
    userName: record.user?.name || (isAdminOrOfficer ? 'Unknown' : (session?.user?.name || 'Self')),
    userEmail: record.user?.email || '',
    employeeId: record.employeeId || record.user?.employeeId || '',
    date: record.date,
    status: record.status,
    checkIn: record.checkIn ? format(new Date(record.checkIn), 'hh:mm a') : '-',
    checkOut: record.checkOut ? format(new Date(record.checkOut), 'hh:mm a') : '-',
    totalWorkingHours: record.totalWorkingHours ? record.totalWorkingHours.toFixed(2) : '0.00',
    breaks: record.breaks?.map((b: any) => ({
      start: b.start ? format(new Date(b.start), 'hh:mm a') : '-',
      end: b.end ? format(new Date(b.end), 'hh:mm a') : '-',
    })) || [],
    notes: record.notes || '',
  }));

  const serializedTodayRecord = todayRecord ? {
    id: todayRecord._id.toString(),
    status: todayRecord.status,
    checkIn: todayRecord.checkIn ? new Date(todayRecord.checkIn).toISOString() : null,
    checkOut: todayRecord.checkOut ? new Date(todayRecord.checkOut).toISOString() : null,
    isOnBreak: todayRecord.breaks?.some((b: any) => !b.end) || false,
    notes: todayRecord.notes || '',
    totalWorkingHours: todayRecord.totalWorkingHours || 0,
  } : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">
          {isAdminOrOfficer 
            ? 'View employee attendance for today.' 
            : 'Your attendance records for this month.'}
        </p>
      </div>

      <AttendanceClient 
        records={serializedRecords} 
        todayRecord={serializedTodayRecord} 
        isEmployee={!isAdminOrOfficer} 
        checkInUrl={checkInUrl}
        qrDataUrl={qrDataUrl}
        hasActiveSession={hasActiveSession}
      />
    </div>
  );
}
```

### `app/dashboard/attendance/client.tsx`

This client component shows the QR attendance widget and the attendance history table.

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, TableIcon } from 'lucide-react';
import { AttendanceTable } from '@/components/AttendanceTable';
import { AdminAttendanceCalendar } from '@/components/AdminAttendanceCalendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AttendanceClient({ records, todayRecord, isEmployee, checkInUrl, qrDataUrl, hasActiveSession }: { records: any[], todayRecord: any, isEmployee: boolean, checkInUrl?: string | null, qrDataUrl?: string | null, hasActiveSession?: boolean }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-[24rem] rounded-xl border bg-muted/20" />;
  }

  return (
    <div className="space-y-6">
      {isEmployee && (
        <Card className="rounded-xl border bg-muted/5">
          <CardHeader>
            <CardTitle>QR Attendance</CardTitle>
            <CardDescription>
              Use your personalized employee QR attendance page to start or complete attendance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Open your employee QR attendance page and allow GPS access. Check-out is enforced within 500m of your check-in location.
            </div>

            {qrDataUrl ? (
              <div className="grid gap-3 sm:grid-cols-[280px_1fr]">
                <div className="rounded-xl border border-muted/60 bg-white p-3 shadow-sm">
                  <img src={qrDataUrl} alt="Attendance QR code" className="w-full h-auto" />
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-900/10 text-emerald-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em]">
                      {hasActiveSession ? 'ACTIVE session found' : 'Ready to check in'}
                    </span>
                  </div>
                  <div className="rounded-xl border border-muted/60 bg-muted/10 p-4 text-sm">
                    <p className="font-medium">Attendance link</p>
                    <p className="truncate text-xs text-muted-foreground mt-1">{checkInUrl}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button className="w-full" asChild>
                      <Link href={checkInUrl ?? '/dashboard/attendance'}>
                        {todayRecord?.checkIn && !todayRecord?.checkOut ? 'Complete Check Out' : 'Open Attendance Check-In'}
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={checkInUrl ?? '/dashboard/attendance'}>
                        Open in New Tab
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-muted/60 bg-muted/10 p-4 text-sm text-muted-foreground">
                Your employee ID is not configured yet. Please contact HR to generate your attendance QR.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <TableIcon className="w-4 h-4" />
            Table View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          ...
        </TabsContent>

        <TabsContent value="calendar">
          <AdminAttendanceCalendar records={records} />
        </TabsContent>

        <TabsContent value="table">
          <AttendanceTable 
            records={records}
            isAdmin={!isEmployee}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

> Note: the `overview` tab content renders the attendance table rows.

### `app/attendance/checkin/page.tsx`

This page ensures only authenticated employees can open the QR attendance page.

```tsx
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AttendanceCheckinClient } from './ui-client';

export default async function AttendanceCheckinPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  if ((session.user as any)?.role !== 'Employee') {
    redirect('/dashboard');
  }

  return <AttendanceCheckinClient />;
}
```

### `app/attendance/checkin/ui-client.tsx`

This client component powers the QR attendance page and handles both check-in and check-out.

```tsx
'use client';

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
```

---

## Data flow summary

1. **Dashboard builds QR link**
   - `app/dashboard/attendance/page.tsx` builds `checkInUrl` and generates QR image.
2. **Employee scans QR**
   - They land on `app/attendance/checkin/page.tsx`.
3. **Client loads status**
   - `app/attendance/checkin/ui-client.tsx` calls `/api/attendance/status`.
4. **Client fetches location**
   - Uses browser `navigator.geolocation`.
5. **Check-in / Check-out action**
   - POST to `/api/attendance/checkin` or `/api/attendance/checkout`.
6. **Backend validates**
   - verifies user role
   - verifies QR employee ID
   - validates GPS coords
   - enforces no duplicate daily attendance
   - enforces 500m checkout distance
7. **Stores data**
   - `AttendanceSession` for active session lifecycle
   - `Attendance` for daily attendance report

---

## Security and validation rules

- Only `Employee` role may use check-in and check-out APIs
- QR employee ID must match the logged-in employee
- Check-in data must include valid latitude/longitude
- A single active session is enforced via a unique partial index in `AttendanceSession`
- Checkout is blocked if the current location is more than 500 meters from the check-in location
- Check-in cannot proceed if the user already completed a full attendance record for the day
- Check-out updates the daily `Attendance` record to compute `totalWorkingHours`

---

## Recommended update process

If you want to add or modify this feature, follow these steps:

1. Update the employee QR URL generation in `app/dashboard/attendance/page.tsx`.
2. Keep the status logic in `app/api/attendance/status/route.ts` aligned with both `Attendance` and `AttendanceSession`.
3. Keep check-in and checkout validation separate for clarity.
4. Preserve `AttendanceSession` for runtime session state, and `Attendance` for daily reporting.
5. Keep UI messages in `app/attendance/checkin/ui-client.tsx` in sync with API error strings.

---

## Notes

- The page `app/attendance/checkin/page.tsx` is not a generic route: it is specifically for QR attendance.
- The feature supports both mobile and desktop as long as geolocation is available.
- The QR image is generated server-side using `qrcode`.
