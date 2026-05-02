"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Users, TrendingUp, Calendar, AlertCircle, CheckCircle } from "lucide-react";

interface PayrollStatsProps {
  records: any[];
  currentMonth: string;
}

export function PayrollStats({ records, currentMonth }: PayrollStatsProps) {
  const totalEmployees = records.length;
  const processedEmployees = records.filter(r => r.status === "Processed").length;
  const paidEmployees = records.filter(r => r.status === "Paid").length;
  const pendingEmployees = records.filter(r => r.status === "Pending").length;
  
  const totalPayroll = records.reduce((sum, record) => sum + record.netSalary, 0);
  const totalDeductions = records.reduce((sum, record) => sum + record.totalDeductions, 0);
  const averageSalary = totalEmployees > 0 ? totalPayroll / totalEmployees : 0;
  
  const totalUnpaidLeaves = records.reduce((sum, record) => sum + record.unpaidLeaves, 0);
  const totalPayableDays = records.reduce((sum, record) => sum + record.payableDays, 0);

  const stats = [
    {
      title: "Total Employees",
      value: totalEmployees,
      icon: Users,
      description: `For ${currentMonth}`,
      color: "text-blue-600"
    },
    {
      title: "Total Payroll",
      value: `₹${totalPayroll.toLocaleString()}`,
      icon: DollarSign,
      description: "Net salary amount",
      color: "text-green-600"
    },
    {
      title: "Average Salary",
      value: `₹${averageSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      description: "Per employee",
      color: "text-purple-600"
    },
    {
      title: "Total Deductions",
      value: `₹${totalDeductions.toLocaleString()}`,
      icon: AlertCircle,
      description: "PF + Professional Tax",
      color: "text-red-600"
    }
  ];

  const statusStats = [
    {
      title: "Paid",
      count: paidEmployees,
      color: "bg-green-500",
      textColor: "text-green-600"
    },
    {
      title: "Processed",
      count: processedEmployees,
      color: "bg-blue-500",
      textColor: "text-blue-600"
    },
    {
      title: "Pending",
      count: pendingEmployees,
      color: "bg-yellow-500",
      textColor: "text-yellow-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Payment Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusStats.map((status, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${status.color}`} />
                    <span className="font-medium">{status.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={status.textColor}>
                      {status.count}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      ({totalEmployees > 0 ? Math.round((status.count / totalEmployees) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Payable Days</span>
              </div>
              <span className="font-semibold text-blue-600">{totalPayableDays}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">Unpaid Leaves</span>
              </div>
              <span className="font-semibold text-red-600">{totalUnpaidLeaves}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Attendance Rate</span>
              </div>
              <span className="font-semibold text-green-600">
                {totalPayableDays + totalUnpaidLeaves > 0 
                  ? Math.round((totalPayableDays / (totalPayableDays + totalUnpaidLeaves)) * 100)
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
