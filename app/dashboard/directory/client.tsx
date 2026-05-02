"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { Edit, Download } from "lucide-react";
import { createEmployee } from "./actions";
import { generateEmployeeReportPDF } from "@/lib/pdfGenerator";

export function DirectoryClient({ employees, canManage }: { employees: any[], canManage: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
      designation: formData.get("designation"),
      department: formData.get("department"),
      basicSalary: Number(formData.get("basicSalary") || 0),
    };

    try {
      await createEmployee(data);
      toast.success("Employee created");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create employee");
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadReport() {
    try {
      generateEmployeeReportPDF(employees, "Employee Directory Report");
      toast.success("Report downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download report");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={handleDownloadReport} 
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Download Report
        </Button>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Add Employee</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input name="name" required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select name="role" defaultValue="Employee">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Employee">Employee</SelectItem>
                      <SelectItem value="HR_Officer">HR Officer</SelectItem>
                      <SelectItem value="Payroll_Officer">Payroll Officer</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Input name="designation" />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input name="department" />
                </div>
                <div className="space-y-2">
                  <Label>Basic Salary</Label>
                  <Input name="basicSalary" type="number" />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Creating..." : "Create"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell className="font-medium">{emp.name}</TableCell>
                <TableCell>{emp.email}</TableCell>
                <TableCell>
                  <Badge variant={emp.role === "Admin" ? "default" : "secondary"}>
                    {emp.role.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>{emp.department || "-"}</TableCell>
                <TableCell>{emp.designation || "-"}</TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <Link href={`/dashboard/profile?userId=${emp.id}`}>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
