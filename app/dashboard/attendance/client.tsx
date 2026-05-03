"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar, TableIcon } from "lucide-react";
import { AttendanceTable } from "@/components/AttendanceTable";
import { AdminAttendanceCalendar } from "@/components/AdminAttendanceCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AttendanceClient({ records, todayRecord, isEmployee, checkInUrl, qrDataUrl, hasActiveSession }: { records: any[], todayRecord: any, isEmployee: boolean, checkInUrl?: string | null, qrDataUrl?: string | null, hasActiveSession?: boolean }) {
  const [activeTab, setActiveTab] = useState("overview");
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
                      {hasActiveSession ? "ACTIVE session found" : "Ready to check in"}
                    </span>
                  </div>
                  <div className="rounded-xl border border-muted/60 bg-muted/10 p-4 text-sm">
                    <p className="font-medium">Attendance link</p>
                    <p className="truncate text-xs text-muted-foreground mt-1">{checkInUrl}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button className="w-full" asChild>
                      <Link href={checkInUrl ?? "/dashboard/attendance"}>
                        {todayRecord?.checkIn && !todayRecord?.checkOut ? "Complete Check Out" : "Open Attendance Check-In"}
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={checkInUrl ?? "/dashboard/attendance"}>
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
          <div className="rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  { !isEmployee && <TableHead>Employee</TableHead> }
                  <TableHead>Status</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Working Hours</TableHead>
                  <TableHead>Breaks</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{record.date}</TableCell>
                    { !isEmployee && (
                      <TableCell>
                        <div>
                          <p className="font-semibold">{record.userName}</p>
                          <p className="text-xs text-muted-foreground">{record.userEmail}</p>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant={record.status === "Present" ? "default" : "secondary"}>
                        {record.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.checkIn}</TableCell>
                    <TableCell>{record.checkOut}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-mono">{record.totalWorkingHours}</span>
                        <span className="text-xs text-muted-foreground">hrs</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {record.breaks.length > 0 ? record.breaks.map((b: any, i: number) => (
                          <span key={i} className="text-xs text-muted-foreground">
                            {b.start} - {b.end}
                          </span>
                        )) : <span className="text-xs text-muted-foreground italic">No breaks</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        {record.notes ? (
                          <p className="text-sm truncate" title={record.notes}>
                            {record.notes}
                          </p>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No notes</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {records.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isEmployee ? 8 : 9} className="text-center py-10 text-muted-foreground italic">
                      No attendance records found for this period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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
