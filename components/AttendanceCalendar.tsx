'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from 'date-fns';

interface AttendanceRecord {
  date: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
  totalWorkingHours?: string;
  notes?: string;
}

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
  currentMonth?: Date;
  isAdmin?: boolean;
  onDateClick?: (date: Date, record?: AttendanceRecord) => void;
}

export function AttendanceCalendar({ 
  records, 
  currentMonth = new Date(), 
  isAdmin = false,
  onDateClick 
}: AttendanceCalendarProps) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Create a map of attendance records by date
  const attendanceMap = new Map<string, AttendanceRecord>();
  records.forEach(record => {
    attendanceMap.set(record.date, record);
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

  const getDayClassNames = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const record = attendanceMap.get(dateStr);
    const isToday = isSameDay(day, new Date());
    
    let classes = 'relative p-2 h-20 border border-border rounded-lg cursor-pointer transition-all hover:shadow-md ';
    
    if (!isSameMonth(day, selectedMonth)) {
      classes += 'opacity-40 ';
    }
    
    if (isToday) {
      classes += 'ring-2 ring-primary ';
    }
    
    if (record) {
      classes += 'bg-muted/30 ';
    }
    
    return classes;
  };

  const renderCalendarDays = () => {
    const days = [];
    const startDay = getDay(monthStart);
    
    // Empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 h-20"></div>);
    }
    
    // Days of the month
    monthDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const record = attendanceMap.get(dateStr);
      
      days.push(
        <div
          key={dateStr}
          className={getDayClassNames(day)}
          onClick={() => onDateClick && onDateClick(day, record)}
        >
          <div className="font-medium text-sm">{format(day, 'd')}</div>
          
          {record && (
            <div className="mt-1 space-y-1">
              <Badge 
                variant={getStatusBadgeVariant(record.status)} 
                className="text-xs px-1 py-0 h-4"
              >
                {record.status.replace('_', ' ')}
              </Badge>
              
              {record.checkIn && (
                <div className="text-xs text-muted-foreground">
                  {record.checkIn} - {record.checkOut || 'Active'}
                </div>
              )}
              
              {record.totalWorkingHours && (
                <div className="text-xs font-mono text-green-600">
                  {parseFloat(record.totalWorkingHours).toFixed(1)}h
                </div>
              )}
            </div>
          )}
          
          {isSameDay(day, new Date()) && !record && (
            <div className="mt-1 text-xs text-muted-foreground">
              No record
            </div>
          )}
        </div>
      );
    });
    
    return days;
  };

  const getMonthStats = () => {
    const stats = {
      Present: 0,
      Absent: 0,
      Half_Day: 0,
      Leave: 0,
      totalHours: 0,
      totalDays: 0
    };
    
    records.forEach(record => {
      if (record.status) {
        stats[record.status as keyof typeof stats]++;
        stats.totalDays++;
        if (record.totalWorkingHours) {
          stats.totalHours += parseFloat(record.totalWorkingHours);
        }
      }
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
              <CalendarIcon className="w-5 h-5" />
              Attendance Calendar
            </CardTitle>
            <CardDescription>
              {format(selectedMonth, 'MMMM yyyy')}
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
        
        {/* Statistics */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">Present: {stats.Present}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm">Absent: {stats.Absent}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm">Half Day: {stats.Half_Day}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm">Leave: {stats.Leave}</span>
          </div>
          {stats.totalHours > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Total Hours: {stats.totalHours.toFixed(1)}</span>
            </div>
          )}
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
          <div className="text-sm font-medium mb-2">Legend:</div>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Half Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <span>No Record</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
