'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, UserCheck, UserX, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from 'date-fns';

interface AttendanceRecord {
  id: string;
  userName: string;
  userEmail: string;
  employeeId: string;
  date: string;
  status: string;
  checkIn: string;
  checkOut: string;
  totalWorkingHours: string;
  notes?: string;
}

interface AdminCalendarProps {
  records: AttendanceRecord[];
  currentMonth?: Date;
}

export function AdminAttendanceCalendar({ 
  records, 
  currentMonth = new Date() 
}: AdminCalendarProps) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Group records by date
  const recordsByDate = new Map<string, AttendanceRecord[]>();
  records.forEach(record => {
    const dateRecords = recordsByDate.get(record.date) || [];
    dateRecords.push(record);
    recordsByDate.set(record.date, dateRecords);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-green-500';
      case 'Absent': return 'bg-red-500';
      case 'Half_Day': return 'bg-yellow-500';
      case 'Leave': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Present': return 'default';
      case 'Absent': return 'destructive';
      case 'Half_Day': return 'secondary';
      case 'Leave': return 'outline';
      default: return 'default';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const getDayStats = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayRecords = recordsByDate.get(dateStr) || [];
    
    const stats = {
      total: dayRecords.length,
      present: dayRecords.filter(r => r.status === 'Present').length,
      absent: dayRecords.filter(r => r.status === 'Absent').length,
      halfDay: dayRecords.filter(r => r.status === 'Half_Day').length,
      leave: dayRecords.filter(r => r.status === 'Leave').length,
      totalHours: dayRecords.reduce((sum, r) => sum + (parseFloat(r.totalWorkingHours) || 0), 0)
    };
    
    return stats;
  };

  const getDayClassNames = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayRecords = recordsByDate.get(dateStr) || [];
    const isToday = isSameDay(day, new Date());
    const stats = getDayStats(day);
    
    let classes = 'relative p-2 h-24 border border-border rounded-lg cursor-pointer transition-all hover:shadow-md ';
    
    if (!isSameMonth(day, selectedMonth)) {
      classes += 'opacity-40 ';
    }
    
    if (isToday) {
      classes += 'ring-2 ring-primary ';
    }
    
    if (dayRecords.length > 0) {
      classes += 'bg-muted/30 ';
    }
    
    return classes;
  };

  const renderCalendarDays = () => {
    const days = [];
    const startDay = getDay(monthStart);
    
    // Empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 h-24"></div>);
    }
    
    // Days of the month
    monthDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayRecords = recordsByDate.get(dateStr) || [];
      const stats = getDayStats(day);
      
      days.push(
        <Dialog key={dateStr}>
          <DialogTrigger asChild>
            <div
              className={getDayClassNames(day)}
              onClick={() => setSelectedDate(day)}
            >
              <div className="font-medium text-sm">{format(day, 'd')}</div>
              
              {dayRecords.length > 0 && (
                <div className="mt-1 space-y-1">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs">{stats.present}</span>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-xs">{stats.absent}</span>
                  </div>
                  
                  {stats.totalHours > 0 && (
                    <div className="text-xs font-mono text-green-600">
                      {stats.totalHours.toFixed(1)}h
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    {stats.total} employees
                  </div>
                </div>
              )}
              
              {isSameDay(day, new Date()) && dayRecords.length === 0 && (
                <div className="mt-1 text-xs text-muted-foreground">
                  No records
                </div>
              )}
            </div>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Attendance Details - {format(day, 'MMMM d, yyyy')}
              </DialogTitle>
              <DialogDescription>
                View detailed attendance information for all employees
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{stats.total}</div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                      <div className="text-sm text-muted-foreground">Present</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                      <div className="text-sm text-muted-foreground">Absent</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-yellow-600">{stats.halfDay}</div>
                      <div className="text-sm text-muted-foreground">Half Day</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-blue-600">{stats.leave}</div>
                      <div className="text-sm text-muted-foreground">Leave</div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Employee List */}
                <div className="space-y-2">
                  <h4 className="font-medium">Employee Details</h4>
                  {dayRecords.length > 0 ? (
                    <div className="space-y-2">
                      {dayRecords.map((record) => (
                        <Card key={record.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div>
                                <div className="font-medium">{record.userName}</div>
                                <div className="text-sm text-muted-foreground">{record.employeeId}</div>
                              </div>
                              <Badge variant={getStatusBadgeVariant(record.status)}>
                                {record.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-sm">
                                {record.checkIn} - {record.checkOut || 'Active'}
                              </div>
                              <div className="text-sm font-mono text-green-600">
                                {record.totalWorkingHours} hrs
                              </div>
                            </div>
                          </div>
                          
                          {record.notes && (
                            <div className="mt-2 p-2 bg-muted/30 rounded text-sm">
                              <strong>Notes:</strong> {record.notes}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No attendance records for this date
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      );
    });
    
    return days;
  };

  const getMonthStats = () => {
    const stats = {
      totalEmployees: new Set(records.map(r => r.userName)).size,
      totalDays: recordsByDate.size,
      present: 0,
      absent: 0,
      halfDay: 0,
      leave: 0,
      totalHours: 0
    };
    
    records.forEach(record => {
      switch (record.status) {
        case 'Present': stats.present++; break;
        case 'Absent': stats.absent++; break;
        case 'Half_Day': stats.halfDay++; break;
        case 'Leave': stats.leave++; break;
      }
      stats.totalHours += parseFloat(record.totalWorkingHours) || 0;
    });
    
    return stats;
  };

  const stats = getMonthStats();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Attendance Calendar
            </CardTitle>
            <CardDescription>
              {format(selectedMonth, 'MMMM yyyy')} • {stats.totalEmployees} employees
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Monthly Statistics */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-green-600" />
            <span className="text-sm">Present: {stats.present}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserX className="w-4 h-4 text-red-600" />
            <span className="text-sm">Absent: {stats.absent}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm">Total Hours: {stats.totalHours.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Active Days: {stats.totalDays}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {renderCalendarDays()}
        </div>
        
        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <div className="text-sm font-medium mb-2">Daily Legend:</div>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Present Employees</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Absent Employees</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-green-600">X.Xh</span>
              <span>Total Hours</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">X employees</span>
              <span>Total Records</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
