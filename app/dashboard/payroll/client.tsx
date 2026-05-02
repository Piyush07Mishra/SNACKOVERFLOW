"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { generatePayroll, processPayment } from "./actions";
import { Download, Users, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { generatePayslipPDF, generatePayrollReportPDF } from "@/lib/pdfGenerator";
import { PayrollStats } from "./payroll-stats";
import { PayrollCharts } from "./payroll-charts";
import { EmployeeWagesTab } from "./employee-wages-tab";
import { EmployeePayslipTab } from "./employee-payslip-tab";
import "./modal.css";

export function PayrollClient({ employees, currentMonth }: { employees: any[], currentMonth: string }) {
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      await generatePayroll(currentMonth);
      toast.success("Payroll generated successfully");
      window.location.reload(); // Reload to show updated data
    } catch (err: any) {
      toast.error(err.message || "Failed to generate payroll");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPayrollReport() {
    try {
      const payrollRecords = employees
        .filter(emp => emp.payroll)
        .map(emp => ({
          userName: emp.name,
          month: emp.payroll.month,
          basicSalary: emp.basicSalary,
          payableDays: emp.payroll.payableDays,
          unpaidLeaves: emp.payroll.unpaidLeaves,
          pfDeduction: emp.payroll.pfDeduction,
          professionalTax: emp.payroll.professionalTax,
          totalEarnings: emp.payroll.totalEarnings,
          totalDeductions: emp.payroll.totalDeductions,
          netSalary: emp.payroll.netSalary,
          status: emp.payroll.status,
        }));
      
      generatePayrollReportPDF(payrollRecords, `Payroll Report - ${currentMonth}`);
      toast.success("Report downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download report");
    }
  }

  const handleEmployeeClick = (employee: any) => {
    setSelectedEmployee(employee);
    setDetailModalOpen(true);
  };

  const processedEmployees = employees.filter(emp => emp.payroll);
  const totalNetSalary = processedEmployees.reduce((sum, emp) => sum + emp.payroll.netSalary, 0);
  const averageSalary = processedEmployees.length > 0 ? totalNetSalary / processedEmployees.length : 0;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">Active workforce</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processedEmployees.length}</div>
            <p className="text-xs text-muted-foreground">For {currentMonth}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payout</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalNetSalary.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Net salary amount</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Math.round(averageSalary).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per employee</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {processedEmployees.length > 0 && <PayrollCharts employees={employees} />}

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

      {/* Employee List */}
      <div className="rounded-md border">
        <div className="grid gap-4 p-4">
          {employees.map((employee) => (
            <Card 
              key={employee.id} 
              className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border-border/50 bg-card/50 backdrop-blur-sm"
              onClick={() => handleEmployeeClick(employee)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {employee.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{employee.name}</h3>
                      <p className="text-sm text-muted-foreground">{employee.designation || employee.role}</p>
                      <p className="text-xs text-muted-foreground">{employee.department || 'General'}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {employee.payroll ? (
                      <div className="space-y-1">
                        <div className="font-bold text-green-600">₹{employee.payroll.netSalary.toLocaleString()}</div>
                        <Badge variant={employee.payroll.status === "Paid" ? "default" : "secondary"}>
                          {employee.payroll.status}
                        </Badge>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Not processed</div>
                        <Badge variant="outline">Pending</Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {employees.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No employees found. Generate payroll to view details.
            </div>
          )}
        </div>
      </div>

      {/* Employee Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="payroll-modal max-h-[95vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-3 text-lg">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-primary">
                  {selectedEmployee?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg">{selectedEmployee?.name}</div>
                <div className="text-sm font-normal text-muted-foreground truncate">
                  {selectedEmployee?.designation || selectedEmployee?.role}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedEmployee && (
            <div className="h-[calc(95vh-8rem)] overflow-hidden">
              <Tabs defaultValue="wages" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="wages" className="text-sm">Daily Wages</TabsTrigger>
                  <TabsTrigger value="payslip" className="text-sm">Payslip</TabsTrigger>
                </TabsList>
                
                <TabsContent value="wages" className="flex-1 overflow-hidden mt-0">
                  <div className="h-full overflow-y-auto pr-2">
                    <EmployeeWagesTab employee={selectedEmployee} currentMonth={currentMonth} />
                  </div>
                </TabsContent>
                
                <TabsContent value="payslip" className="flex-1 overflow-hidden mt-0">
                  <div className="h-full overflow-y-auto pr-2">
                    <EmployeePayslipTab 
                      employee={selectedEmployee} 
                      currentMonth={currentMonth}
                      onPaymentProcessed={() => window.location.reload()}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
