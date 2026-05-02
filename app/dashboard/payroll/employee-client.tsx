"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, DollarSign, Download, FileText } from "lucide-react";
import { format, parse } from "date-fns";
import { generatePayslipPDF } from "@/lib/pdfGenerator";
import { toast } from "sonner";
import { EmployeeStats } from "./employee-stats";

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

export function PayrollEmployeeClient({ records, employeeName = "Employee" }: { records: PayrollRecord[], employeeName?: string }) {
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);

  const formatMonth = (monthStr: string) => {
    try {
      const date = parse(monthStr, "yyyy-MM", new Date());
      return format(date, "MMMM yyyy");
    } catch {
      return monthStr;
    }
  };

  const handleDownloadPayslip = async (record: PayrollRecord) => {
    try {
      await generatePayslipPDF(employeeName, record.month, {
        basicSalary: record.basicSalary,
        payableDays: record.payableDays,
        unpaidLeaves: record.unpaidLeaves,
        pfDeduction: record.pfDeduction,
        professionalTax: record.professionalTax,
        totalEarnings: record.totalEarnings,
        totalDeductions: record.totalDeductions,
        netSalary: record.netSalary,
        status: record.status,
      });
      toast.success("Payslip downloaded successfully!");
    } catch (error) {
      console.error("Error downloading payslip:", error);
      toast.error("Failed to download payslip");
    }
  };

  return (
    <div className="space-y-6">
      {/* Employee Statistics */}
      <EmployeeStats records={records} />

      {/* Payslips List */}
      <Card>
        <CardHeader>
          <CardTitle>Payslip History</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payroll records found. Check back later.
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{formatMonth(record.month)}</p>
                        <p className="text-sm text-muted-foreground">
                          ₹{record.basicSalary.toFixed(2)} basic • {record.payableDays} payable days
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg text-green-600">₹{record.netSalary.toFixed(2)}</p>
                      <Badge variant={record.status === "Paid" ? "default" : "secondary"}>
                        {record.status}
                      </Badge>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedPayslip(record)}
                        >
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Payslip - {formatMonth(record.month)}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                          {/* Payslip Header */}
                          <div className="border-b pb-4">
                            <h3 className="font-semibold text-lg mb-2">Payslip Details</h3>
                            <p className="text-sm text-muted-foreground">
                              Generated on {new Date(record.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          {/* Attendance Section */}
                          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                            <h4 className="font-semibold mb-3">Attendance</h4>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Payable Days</p>
                                <p className="text-lg font-semibold text-blue-600">{record.payableDays}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Unpaid Leaves</p>
                                <p className="text-lg font-semibold text-red-600">{record.unpaidLeaves}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Working Days</p>
                                <p className="text-lg font-semibold">{(record.payableDays + record.unpaidLeaves).toFixed(0)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Earnings Section */}
                          <div>
                            <h4 className="font-semibold mb-3">Earnings</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Basic Salary</span>
                                <span className="font-medium">₹{record.basicSalary.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between border-t pt-2">
                                <span className="font-semibold">Total Earnings (Prorated)</span>
                                <span className="font-bold">₹{record.totalEarnings.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Deductions Section */}
                          <div>
                            <h4 className="font-semibold mb-3">Deductions</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>PF Deduction (12%)</span>
                                <span className="font-medium text-red-600">-₹{record.pfDeduction.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Professional Tax</span>
                                <span className="font-medium text-red-600">-₹{record.professionalTax.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between border-t pt-2">
                                <span className="font-semibold">Total Deductions</span>
                                <span className="font-bold text-red-600">-₹{record.totalDeductions.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Net Salary Section */}
                          <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold text-lg">Net Salary</h4>
                              <p className="text-2xl font-bold text-green-600">₹{record.netSalary.toFixed(2)}</p>
                            </div>
                          </div>

                          {/* Status and Actions */}
                          <div className="flex items-center justify-between pt-4 border-t">
                            <div>
                              <p className="text-sm text-muted-foreground">Status:</p>
                              <Badge className="mt-1" variant={record.status === "Paid" ? "default" : "secondary"}>
                                {record.status}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() => handleDownloadPayslip(record)}
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Year-over-Year Trends */}
      {records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Salary Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="earnings" className="w-full">
              <TabsList>
                <TabsTrigger value="earnings">Earnings</TabsTrigger>
                <TabsTrigger value="deductions">Deductions</TabsTrigger>
              </TabsList>
              <TabsContent value="earnings" className="space-y-4 mt-4">
                <div className="space-y-3">
                  {records.map((record) => (
                    <div key={record.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium w-32">{formatMonth(record.month)}</span>
                      <div className="flex-1 bg-muted h-2 rounded mx-4">
                        <div
                          className="bg-green-600 h-2 rounded"
                          style={{
                            width: `${(record.totalEarnings / Math.max(...records.map(r => r.totalEarnings))) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-24 text-right">₹{record.totalEarnings.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="deductions" className="space-y-4 mt-4">
                <div className="space-y-3">
                  {records.map((record) => (
                    <div key={record.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium w-32">{formatMonth(record.month)}</span>
                      <div className="flex-1 bg-muted h-2 rounded mx-4">
                        <div
                          className="bg-red-600 h-2 rounded"
                          style={{
                            width: `${(record.totalDeductions / Math.max(...records.map(r => r.totalDeductions))) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-24 text-right">₹{record.totalDeductions.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
