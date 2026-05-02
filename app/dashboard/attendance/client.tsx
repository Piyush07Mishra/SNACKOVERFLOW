"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { markAttendance } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AttendanceClient({ records, todayStatus, isEmployee }: { records: any[], todayStatus: string | null, isEmployee: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleMarkAttendance(status: "Present" | "Half_Day" | "Absent") {
    setLoading(true);
    try {
      await markAttendance(status);
      toast.success("Attendance marked successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to mark attendance");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {isEmployee && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
            <CardDescription>Mark your attendance for today.</CardDescription>
          </CardHeader>
          <CardContent>
            {todayStatus ? (
              <div className="flex items-center gap-2">
                <span>Status:</span>
                <Badge variant={todayStatus === "Present" ? "default" : "secondary"}>{todayStatus.replace("_", " ")}</Badge>
              </div>
            ) : (
              <div className="flex gap-4">
                <Button onClick={() => handleMarkAttendance("Present")} disabled={loading}>Mark Present</Button>
                <Button variant="outline" onClick={() => handleMarkAttendance("Half_Day")} disabled={loading}>Half Day</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Employee Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Check In</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.date}</TableCell>
                <TableCell>{record.userName}</TableCell>
                <TableCell>
                  <Badge variant={record.status === "Present" ? "default" : "secondary"}>
                    {record.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>{record.checkIn}</TableCell>
              </TableRow>
            ))}
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  No attendance records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
