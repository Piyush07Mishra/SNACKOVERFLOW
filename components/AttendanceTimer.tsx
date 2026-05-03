'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Clock, LogIn, LogOut, Coffee, Edit2, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface AttendanceRecord {
  id: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  isOnBreak: boolean;
  notes: string;
  totalWorkingHours: number;
}

export function AttendanceTimer({ todayRecord, onAction }: { 
  todayRecord: AttendanceRecord | null, 
  onAction: (action: string, data?: any) => Promise<void> 
}) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [breakElapsedTime, setBreakElapsedTime] = useState(0);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(todayRecord?.notes || '');

  // Update current time every second
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate elapsed time since check-in
  useEffect(() => {
    if (todayRecord?.checkIn && !todayRecord?.checkOut) {
      const checkInTime = new Date(todayRecord.checkIn);
      const interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - checkInTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [todayRecord]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveNote = async () => {
    try {
      await onAction('updateNote', { notes: noteText });
      setIsEditingNote(false);
      toast.success("Note saved successfully");
    } catch (error) {
      toast.error("Failed to save note");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'default';
      case 'Absent': return 'destructive';
      case 'Half_Day': return 'secondary';
      case 'Leave': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Timer Card */}
      <Card className="bg-gradient-to-br from-background to-muted/50 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Daily Attendance Timer
          </CardTitle>
          <CardDescription>
            Track your working hours in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Time Display */}
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-3xl font-mono font-bold text-primary" suppressHydrationWarning>
                {currentTime
                  ? currentTime.toLocaleTimeString()
                  : '--:--:--'}
              </div>
              <div className="text-sm text-muted-foreground" suppressHydrationWarning>
                {currentTime
                  ? currentTime.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Loading current date...'}
              </div>
            </div>

            {/* Status and Timer */}
            {todayRecord ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={getStatusColor(todayRecord.status)} className="py-2 px-4">
                    Status: {todayRecord.status.replace('_', ' ')}
                  </Badge>
                  {todayRecord.checkIn && !todayRecord.checkOut && (
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Time Elapsed</div>
                      <div className="text-2xl font-mono font-bold text-green-600">
                        {formatTime(elapsedTime)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {!todayRecord.checkOut && (
                    <>
                      {todayRecord.isOnBreak ? (
                        <Button 
                          variant="outline" 
                          onClick={() => onAction('endBreak')}
                          className="border-orange-500 text-orange-500 hover:bg-orange-50"
                        >
                          <Coffee className="w-4 h-4 mr-2" />
                          End Break
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          onClick={() => onAction('startBreak')}
                        >
                          <Coffee className="w-4 h-4 mr-2" />
                          Start Break
                        </Button>
                      )}
                      
                      <Button 
                        variant="destructive" 
                        onClick={() => onAction('checkOut')}
                        disabled={todayRecord.isOnBreak}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Check Out
                      </Button>
                    </>
                  )}
                  
                  {todayRecord.checkOut && (
                    <Badge variant="outline" className="py-2 px-4 text-sm font-semibold">
                      ✓ Shift Completed ({typeof todayRecord.totalWorkingHours === 'number' ? todayRecord.totalWorkingHours.toFixed(2) : parseFloat(todayRecord.totalWorkingHours || '0').toFixed(2)} hrs)
                    </Badge>
                  )}
                </div>

                {/* Notes Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Daily Notes</h4>
                    {!isEditingNote && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setIsEditingNote(true)}
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  
                  {isEditingNote ? (
                    <div className="space-y-2">
                      <Textarea
                        value={noteText}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNoteText(e.target.value)}
                        placeholder="Add notes about your workday..."
                        className="min-h-[80px]"
                        role="textbox"
                        aria-label="Notes"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveNote} role="button" aria-label="Save Notes">
                          <Save className="w-3 h-3 mr-1" aria-hidden="true" />
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setIsEditingNote(false);
                            setNoteText(todayRecord?.notes || '');
                          }}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/30 rounded-md min-h-[60px]">
                      {noteText ? (
                        <p className="text-sm">{noteText}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No notes added</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Button 
                  onClick={() => onAction('checkIn')} 
                  className="bg-primary hover:bg-primary/90 px-8 py-3"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Check In Now
                </Button>
                <p className="text-sm text-muted-foreground mt-3">
                  Start tracking your workday
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
