"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { checkIn, checkOut, startBreak, endBreak } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogIn, LogOut, Coffee } from "lucide-react";

export function AttendanceClient({ records, todayRecord, isEmployee }: { records: any[], todayRecord: any, isEmployee: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleAction(action: Function, successMsg: string) {
    setLoading(true);
    try {
      await action();
      toast.success(successMsg);
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {isEmployee && (
        <Card className="bg-gradient-to-br from-background to-muted/50 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Daily Tracking
            </CardTitle>
            <CardDescription>Record your working hours and breaks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {!todayRecord ? (
                <Button 
                  onClick={() => handleAction(checkIn, "Checked in successfully")} 
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Check In
                </Button>
              ) : (
                <>
                  <div className="flex items-center gap-2 mr-4 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
                    Status: {todayRecord.status}
                  </div>
                  
                  {!todayRecord.checkOut && (
                    <>
                      {todayRecord.isOnBreak ? (
                        <Button 
                          variant="outline" 
                          onClick={() => handleAction(endBreak, "Break ended")} 
                          disabled={loading}
                          className="border-orange-500 text-orange-500 hover:bg-orange-50"
                        >
                          <Coffee className="w-4 h-4 mr-2" />
                          End Break
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          onClick={() => handleAction(startBreak, "Break started")} 
                          disabled={loading}
                        >
                          <Coffee className="w-4 h-4 mr-2" />
                          Start Break
                        </Button>
                      )}
                      
                      <Button 
                        variant="destructive" 
                        onClick={() => handleAction(checkOut, "Checked out successfully")} 
                        disabled={loading || todayRecord.isOnBreak}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Check Out
                      </Button>
                    </>
                  )}
                  
                  {todayRecord.checkOut && (
                    <Badge variant="outline" className="py-2 px-4 text-sm font-semibold">
                      Shift Completed
                    </Badge>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
              </TableRow>
            ))}
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={isEmployee ? 6 : 7} className="text-center py-10 text-muted-foreground italic">
                  No attendance records found for this period.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
