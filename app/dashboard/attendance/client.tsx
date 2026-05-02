"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { checkIn, checkOut, startBreak, endBreak, updateAttendanceNote } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogIn, LogOut, Coffee, Calendar, TableIcon, Users } from "lucide-react";
import { AttendanceTimer } from "@/components/AttendanceTimer";
import { AttendanceTable } from "@/components/AttendanceTable";
import { AdminAttendanceCalendar } from "@/components/AdminAttendanceCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AttendanceClient({ records, todayRecord, isEmployee }: { records: any[], todayRecord: any, isEmployee: boolean }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  async function handleAction(action: string, data?: any) {
    setLoading(true);
    try {
      switch (action) {
        case 'checkIn':
          await checkIn();
          toast.success("Checked in successfully");
          break;
        case 'checkOut':
          await checkOut();
          toast.success("Checked out successfully");
          break;
        case 'startBreak':
          await startBreak();
          toast.success("Break started");
          break;
        case 'endBreak':
          await endBreak();
          toast.success("Break ended");
          break;
        case 'updateNote':
          await updateAttendanceNote(data.notes);
          toast.success("Note updated successfully");
          break;
        default:
          break;
      }
      // Refresh the page to show updated data
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setLoading(false);
    }
  }

  
  return (
    <div className="space-y-6">
      {isEmployee && (
        <AttendanceTimer 
          todayRecord={todayRecord} 
          onAction={handleAction} 
        />
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
