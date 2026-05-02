"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Calendar, Award } from "lucide-react";

interface PayrollRecord {
  id: string;
  month: string;
  basicSalary: number;
  payableDays: number;
  unpaidLeaves: number;
  pfDeduction: number;
  professionalTax: number;
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
  createdAt: string;
}

interface EmployeeStatsProps {
  records: PayrollRecord[];
}

export function EmployeeStats({ records }: EmployeeStatsProps) {
  if (records.length === 0) return null;

  const latestRecord = records[0];
  const totalEarnings = records.reduce((sum, record) => sum + record.netSalary, 0);
  const totalDeductions = records.reduce((sum, record) => sum + record.totalDeductions, 0);
  const averageSalary = totalEarnings / records.length;
  
  const totalPayableDays = records.reduce((sum, record) => sum + record.payableDays, 0);
  const totalUnpaidLeaves = records.reduce((sum, record) => sum + record.unpaidLeaves, 0);
  const attendanceRate = totalPayableDays + totalUnpaidLeaves > 0 
    ? Math.round((totalPayableDays / (totalPayableDays + totalUnpaidLeaves)) * 100)
    : 0;

  const paidMonths = records.filter(r => r.status === "Paid").length;
  const processedMonths = records.filter(r => r.status === "Processed").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Latest Salary</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{latestRecord.netSalary.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">For {latestRecord.month}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{averageSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <p className="text-xs text-muted-foreground">Across {records.length} months</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          <Award className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{totalEarnings.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Career total</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
          <Calendar className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{attendanceRate}%</div>
          <p className="text-xs text-muted-foreground">{totalUnpaidLeaves} unpaid leaves</p>
        </CardContent>
      </Card>
    </div>
  );
}
