"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, CheckCircle, AlertCircle } from "lucide-react";
import { generatePayslipPDF } from "@/lib/pdfGenerator";
import { processPayment } from "./actions";

interface EmployeePayslipTabProps {
  employee: any;
  currentMonth: string;
  onPaymentProcessed: () => void;
}

export function EmployeePayslipTab({ employee, currentMonth, onPaymentProcessed }: EmployeePayslipTabProps) {
  const [processingPayment, setProcessingPayment] = useState(false);

  const handleDownloadPayslip = async () => {
    if (!employee.payroll) {
      toast.error("No payroll data available for download");
      return;
    }

    try {
      await generatePayslipPDF(employee.name, currentMonth, {
        basicSalary: employee.basicSalary,
        payableDays: employee.payroll.payableDays,
        unpaidLeaves: employee.payroll.unpaidLeaves,
        pfDeduction: employee.payroll.pfDeduction,
        professionalTax: employee.payroll.professionalTax,
        totalEarnings: employee.payroll.totalEarnings,
        totalDeductions: employee.payroll.totalDeductions,
        netSalary: employee.payroll.netSalary,
        status: employee.payroll.status,
      });
      toast.success("Payslip downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download payslip");
    }
  };

  const handleProcessPayment = async () => {
    if (!employee.payroll) {
      toast.error("No payroll data available");
      return;
    }

    setProcessingPayment(true);
    try {
      await processPayment(employee.payroll.id);
      toast.success("Payment processed successfully!");
      onPaymentProcessed();
    } catch (err: any) {
      toast.error(err.message || "Failed to process payment");
    } finally {
      setProcessingPayment(false);
    }
  };

  if (!employee.payroll) {
    return (
      <div className="text-center py-12">
        <div className="bg-muted/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-3">No Payroll Data Available</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Payroll for {currentMonth} hasn't been generated yet. Please generate payroll to view payslip details.
        </p>
        <Button onClick={() => window.location.reload()} size="lg">
          Generate Payroll
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg font-semibold text-purple-800">Payment Status</span>
            <Badge 
              variant={employee.payroll.status === "Paid" ? "default" : "secondary"}
              className="text-sm px-3 py-1"
            >
              {employee.payroll.status === "Paid" ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Paid
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Pending
                </div>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 gap-2 h-11" 
              onClick={handleDownloadPayslip}
            >
              <Download className="h-4 w-4" />
              Download Payslip
            </Button>
            {employee.payroll.status !== "Paid" && (
              <Button 
                className="flex-1 h-11" 
                onClick={handleProcessPayment}
                disabled={processingPayment}
              >
                {processingPayment ? "Processing..." : "Mark as Paid"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Employee Information */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Employee Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                👤 Personal Details
              </h4>
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-700">Name:</span>
                  <span className="font-semibold">{employee.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-700">Designation:</span>
                  <span>{employee.designation || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-700">Department:</span>
                  <span>{employee.department || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-700">Role:</span>
                  <Badge variant="outline">{employee.role.replace('_', ' ')}</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-green-800 flex items-center gap-2">
                📅 Pay Period
              </h4>
              <div className="bg-green-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-700">Month:</span>
                  <span className="font-semibold">{currentMonth}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-700">Payable Days:</span>
                  <span className="font-bold text-green-600 text-lg">{employee.payroll.payableDays}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-700">Unpaid Leaves:</span>
                  <span className="text-red-500 font-semibold">{employee.payroll.unpaidLeaves}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-700">Status:</span>
                  <Badge variant={employee.payroll.status === "Paid" ? "default" : "secondary"}>
                    {employee.payroll.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings, Deductions, and Net Salary in one row */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Earnings */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              💰 Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-blue-700">Basic Salary:</span>
                <span className="font-semibold">₹{(employee.basicSalary || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-blue-700">Prorated ({employee.payroll.payableDays} days):</span>
                <span className="font-semibold text-blue-600">₹{(employee.payroll.totalEarnings || 0).toLocaleString()}</span>
              </div>
              <div className="border-t border-blue-200 pt-3">
                <div className="flex justify-between font-bold">
                  <span className="text-blue-800">Total Earnings:</span>
                  <span className="text-green-600 text-lg">₹{(employee.payroll.totalEarnings || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deductions */}
        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              📉 Deductions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-red-700">Provident Fund (12%):</span>
                <span>₹{(employee.payroll.pfDeduction || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-red-700">Professional Tax:</span>
                <span>₹{(employee.payroll.professionalTax || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-red-700">Loss of Pay ({employee.payroll.unpaidLeaves} days):</span>
                <span className="text-red-500 font-semibold">
                  ₹{Math.round(((employee.basicSalary || 0) / 22) * (employee.payroll.unpaidLeaves || 0)).toLocaleString()}
                </span>
              </div>
              <div className="border-t border-red-200 pt-3">
                <div className="flex justify-between font-bold">
                  <span className="text-red-800">Total Deductions:</span>
                  <span className="text-red-600 text-lg">₹{(employee.payroll.totalDeductions || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Salary */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              💵 Net Salary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-3xl font-bold text-green-600">
                ₹{(employee.payroll.netSalary || 0).toLocaleString()}
              </div>
              <p className="text-sm text-green-600">
                Take-home salary for {currentMonth}
              </p>
              <div className="bg-white/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Monthly:</span>
                  <span className="font-semibold">₹{Math.round(employee.payroll.netSalary || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Daily:</span>
                  <span className="font-semibold">₹{Math.round((employee.payroll.netSalary || 0) / (employee.payroll.payableDays || 1)).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calculation Summary */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle>Calculation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Formula Applied:</h4>
                <div className="bg-muted p-3 rounded text-xs font-mono space-y-1">
                  <div>Daily Wage = Basic Salary ÷ 22 days</div>
                  <div>Prorated Salary = Daily Wage × Payable Days</div>
                  <div>PF Deduction = Prorated Salary × 12%</div>
                  <div>Professional Tax = ₹200 (fixed)</div>
                  <div>Net Salary = Prorated Salary - Total Deductions</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Breakdown:</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Basic Salary:</span>
                    <span>₹{(employee.basicSalary || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Rate:</span>
                    <span>₹{Math.round((employee.basicSalary || 0) / 22).toLocaleString()}/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payable Days:</span>
                    <span>{employee.payroll.payableDays || 0} days</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Net Daily Rate:</span>
                    <span>₹{Math.round((employee.payroll.netSalary || 0) / (employee.payroll.payableDays || 1)).toLocaleString()}/day</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
