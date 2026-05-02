"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

interface PayrollChartsProps {
  employees: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function PayrollCharts({ employees }: PayrollChartsProps) {
  // Convert employees to records format for compatibility
  const records = employees
    .filter(emp => emp.payroll)
    .map(emp => ({
      userName: emp.name,
      basicSalary: emp.basicSalary,
      netSalary: emp.payroll.netSalary,
      status: emp.payroll.status,
      pfDeduction: emp.payroll.pfDeduction,
      professionalTax: emp.payroll.professionalTax,
      totalDeductions: emp.payroll.totalDeductions,
    }));
  // Salary distribution data
  const salaryRanges = [
    { range: '0-2k', count: 0, total: 0 },
    { range: '2k-4k', count: 0, total: 0 },
    { range: '4k-6k', count: 0, total: 0 },
    { range: '6k-8k', count: 0, total: 0 },
    { range: '8k+', count: 0, total: 0 }
  ];

  records.forEach(record => {
    const salary = record.netSalary;
    if (salary < 2000) {
      salaryRanges[0].count++;
      salaryRanges[0].total += salary;
    } else if (salary < 4000) {
      salaryRanges[1].count++;
      salaryRanges[1].total += salary;
    } else if (salary < 6000) {
      salaryRanges[2].count++;
      salaryRanges[2].total += salary;
    } else if (salary < 8000) {
      salaryRanges[3].count++;
      salaryRanges[3].total += salary;
    } else {
      salaryRanges[4].count++;
      salaryRanges[4].total += salary;
    }
  });

  // Status distribution for pie chart
  const statusData = [
    { name: 'Paid', value: records.filter(r => r.status === 'Paid').length, color: '#10b981' },
    { name: 'Processed', value: records.filter(r => r.status === 'Processed').length, color: '#3b82f6' },
    { name: 'Pending', value: records.filter(r => r.status === 'Pending').length, color: '#f59e0b' }
  ].filter(item => item.value > 0);

  // Top earners data
  const topEarners = [...records]
    .sort((a, b) => b.netSalary - a.netSalary)
    .slice(0, 5)
    .map(record => ({
      name: record.userName,
      salary: record.netSalary,
      deductions: record.totalDeductions
    }));

  // Deductions breakdown
  const deductionsData = records.map(record => ({
    name: record.userName,
    pf: record.pfDeduction,
    professionalTax: record.professionalTax,
    total: record.totalDeductions
  })).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Salary Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salaryRanges}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'count' ? `${value} employees` : `₹${value}`,
                    name === 'count' ? 'Employees' : 'Total Salary'
                  ]}
                />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Earners Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 5 Earners</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topEarners} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip formatter={(value) => [`₹${value}`, '']} />
                <Bar dataKey="salary" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Deductions Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deductions Breakdown (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deductionsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value}`, '']} />
                <Legend />
                <Bar dataKey="pf" stackId="a" fill="#ef4444" name="PF Deduction" />
                <Bar dataKey="professionalTax" stackId="a" fill="#f59e0b" name="Professional Tax" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
