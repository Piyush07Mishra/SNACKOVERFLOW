"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { generatePayroll, processPayment } from "./actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download } from "lucide-react";
import { generatePayslipPDF, generateEmployeeReportPDF } from "@/lib/pdfGenerator";
import { PayrollStats } from "./payroll-stats";
import { PayrollCharts } from "./payroll-charts";

export function PayrollClient({ records, currentMonth }: { records: any[], currentMonth: string }) {
  const [loading, setLoading] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  async function handleGenerate() {
    setLoading(true);
    try {
      await generatePayroll(currentMonth);
      toast.success("Payroll generated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate payroll");
    } finally {
      setLoading(false);
    }
  }

  async function handlePayment(id: string) {
    try {
      await processPayment(id);
      toast.success("Payment processed");
    } catch (err: any) {
      toast.error(err.message || "Failed to process payment");
    }
  }

  async function handleDownloadPayslip(record: any) {
    try {
      await generatePayslipPDF(record.userName, record.month, {
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
      toast.error("Failed to download payslip");
    }
  }

  async function handleDownloadPayrollReport() {
    try {
      generateEmployeeReportPDF(records, `Payroll Report - ${currentMonth}`);
      toast.success("Report downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download report");
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics and Charts Section */}
      {records.length > 0 && (
        <>
          <PayrollStats records={records} currentMonth={currentMonth} />
          <PayrollCharts records={records} />
        </>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button onClick={handleDownloadPayrollReport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Download Report
        </Button>
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate Monthly Payroll"}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee Name</TableHead>
              <TableHead>Basic Salary</TableHead>
              <TableHead>Net Salary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((rec) => (
              <TableRow key={rec.id}>
                <TableCell className="font-medium">{rec.userName}</TableCell>
                <TableCell>₹{rec.basicSalary}</TableCell>
                <TableCell className="font-bold">₹{rec.netSalary}</TableCell>
                <TableCell>
                  <Badge variant={rec.status === "Paid" ? "default" : "secondary"}>{rec.status}</Badge>
                </TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => setSelectedPayslip(rec)}>View Payslip</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Payslip - {rec.userName}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="font-semibold">Month:</div><div>{rec.month}</div>
                          <div className="font-semibold">Payable Days:</div><div className="text-blue-600 font-bold">{rec.payableDays}</div>
                          <div className="font-semibold">Unpaid Leaves:</div><div className="text-red-500">{rec.unpaidLeaves}</div>
                          <div className="font-semibold border-t pt-2">Basic Salary:</div><div className="border-t pt-2">₹{rec.basicSalary}</div>
                          <div className="font-semibold">PF Deduction (12%):</div><div>₹{rec.pfDeduction.toFixed(2)}</div>
                          <div className="font-semibold">Professional Tax:</div><div>₹{rec.professionalTax}</div>
                          <div className="font-semibold border-t pt-2">Earnings (Prorated):</div><div className="border-t pt-2">₹{rec.totalEarnings.toFixed(2)}</div>
                          <div className="font-semibold text-red-500">Total Deductions:</div><div className="text-red-500">₹{rec.totalDeductions.toFixed(2)}</div>
                          <div className="font-bold border-t pt-2 text-green-600 text-lg">Net Salary:</div><div className="font-bold border-t pt-2 text-green-600 text-lg">₹{rec.netSalary.toFixed(2)}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="flex-1 gap-2" 
                            onClick={() => handleDownloadPayslip(rec)}
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                          {rec.status !== "Paid" && (
                            <Button className="flex-1" onClick={() => handlePayment(rec.id)}>Mark as Paid</Button>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  No payroll records found for {currentMonth}. Generate payroll to view.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
