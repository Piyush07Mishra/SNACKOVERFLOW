"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Clock, Coffee, DollarSign } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parse } from "date-fns";

interface DailyRecord {
  date: string;
  checkIn?: Date;
  checkOut?: Date;
  totalWorkingHours: number;
  breaks: Array<{ start: Date, end: Date }>;
  status: 'Present' | 'Half_Day' | 'Absent' | 'Leave';
  wage: number;
}

interface EmployeeWagesTabProps {
  employee: any;
  currentMonth: string;
}

export function EmployeeWagesTab({ employee, currentMonth }: EmployeeWagesTabProps) {
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    fetchDailyRecords();
  }, [employee.id, currentMonth]);

  const fetchDailyRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employee/wages?employeeId=${employee.id}&month=${currentMonth}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setDailyRecords(data);
      }
    } catch (error) {
      console.error('Failed to fetch daily records:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDailyWage = (hours: number, basicSalary: number) => {
    // Assuming 22 working days per month and 8 hours per day
    const dailyWage = basicSalary / 22;
    const hourlyWage = dailyWage / 8;
    return Math.round(hours * hourlyWage);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-green-500';
      case 'Half_Day': return 'bg-yellow-500';
      case 'Leave': return 'bg-blue-500';
      case 'Absent': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Present': return <Badge variant="default" className="bg-green-100 text-green-800">Present</Badge>;
      case 'Half_Day': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Half Day</Badge>;
      case 'Leave': return <Badge variant="outline" className="bg-blue-100 text-blue-800">Leave</Badge>;
      case 'Absent': return <Badge variant="destructive">Absent</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getDayRecord = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return dailyRecords.find(record => record.date === dateStr);
  };

  const totalWages = dailyRecords.reduce((sum, record) => sum + record.wage, 0);
  const totalHours = dailyRecords.reduce((sum, record) => sum + record.totalWorkingHours, 0);
  const presentDays = dailyRecords.filter(record => record.status === 'Present').length;
  const halfDays = dailyRecords.filter(record => record.status === 'Half_Day').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading wage details...</p>
      </div>
    );
  }

  const monthStart = startOfMonth(parse(currentMonth, 'yyyy-MM', new Date()));
  const monthEnd = endOfMonth(monthStart);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Hours worked</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Days</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presentDays}</div>
            <p className="text-xs text-muted-foreground">Full days</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Half Days</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{halfDays}</div>
            <p className="text-xs text-muted-foreground">Partial attendance</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wages</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalWages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">For {currentMonth}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3 lg:grid-cols-2">
        {/* Calendar */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 xl:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Attendance Calendar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={monthStart}
                className="rounded-lg border bg-background p-1"
                modifiers={{
                  present: (date) => getDayRecord(date)?.status === 'Present',
                  halfDay: (date) => getDayRecord(date)?.status === 'Half_Day',
                  leave: (date) => getDayRecord(date)?.status === 'Leave',
                  absent: (date) => getDayRecord(date)?.status === 'Absent',
                }}
                modifiersClassNames={{
                  present: 'bg-green-500 text-white hover:bg-green-600 font-semibold',
                  halfDay: 'bg-yellow-500 text-white hover:bg-yellow-600 font-semibold',
                  leave: 'bg-blue-500 text-white hover:bg-blue-600 font-semibold',
                  absent: 'bg-red-500 text-white hover:bg-red-600 font-semibold',
                }}
                disabled={(date) => !isSameMonth(date, monthStart)}
              />
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-xs border-t pt-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Half Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Absent</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Breakdown Table */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Daily Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-28">Date</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-20 text-right">Hours</TableHead>
                    <TableHead className="w-24 text-right">Wage</TableHead>
                    <TableHead className="w-32 text-right">Daily Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyRecords
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((record) => (
                      <TableRow key={record.date} className="hover:bg-muted/50">
                        <TableCell className="font-medium text-sm">
                          {format(new Date(record.date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {record.totalWorkingHours.toFixed(1)}h
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm">
                          ₹{record.wage}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          ₹{record.totalWorkingHours > 0 ? Math.round(record.wage / record.totalWorkingHours) : 0}/h
                        </TableCell>
                      </TableRow>
                    ))}
                  {dailyRecords.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <div className="space-y-2">
                          <div className="text-lg">📅</div>
                          <div>No attendance records found for {currentMonth}</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Date Details */}
      {selectedDate && getDayRecord(selectedDate) && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              📅 Details for {format(selectedDate, 'MMMM dd, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const record = getDayRecord(selectedDate);
              if (!record) return null;
              
              return (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                      ⏰ Attendance Details
                    </h4>
                    <div className="bg-white/50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Status:</span>
                        {getStatusBadge(record.status)}
                      </div>
                      {record.checkIn && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Check In:</span>
                          <span className="font-mono text-sm bg-green-100 px-2 py-1 rounded">
                            {format(record.checkIn, 'hh:mm a')}
                          </span>
                        </div>
                      )}
                      {record.checkOut && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Check Out:</span>
                          <span className="font-mono text-sm bg-red-100 px-2 py-1 rounded">
                            {format(record.checkOut, 'hh:mm a')}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm font-medium">Total Hours:</span>
                        <span className="font-bold text-blue-600">
                          {record.totalWorkingHours.toFixed(1)} hours
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-green-800 flex items-center gap-2">
                      💰 Wage Calculation
                    </h4>
                    <div className="bg-white/50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Basic Salary (Monthly):</span>
                        <span className="font-semibold">₹{(employee.basicSalary || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Daily Wage:</span>
                        <span className="font-mono text-sm">₹{Math.round((employee.basicSalary || 0) / 22).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Hourly Wage:</span>
                        <span className="font-mono text-sm">₹{Math.round((employee.basicSalary || 0) / 22 / 8).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t">
                        <span className="text-sm font-bold">Daily Earnings:</span>
                        <span className="font-bold text-green-600 text-lg">₹{record.wage}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
