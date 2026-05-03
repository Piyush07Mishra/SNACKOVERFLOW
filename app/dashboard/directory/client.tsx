"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/ui/table-pagination";
import { toast } from "sonner";
import Link from "next/link";
import { Edit, Download, Trash2, AlertTriangle, Search } from "lucide-react";
import { createEmployee, deleteEmployee } from "./actions";
import { generateEmployeeReportPDF } from "@/lib/pdfGenerator";

export function DirectoryClient({ employees, canManage }: { employees: any[], canManage: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  async function handleDeleteEmployee() {
    if (!employeeToDelete) return;

    setDeleteLoading(true);
    try {
      await deleteEmployee(employeeToDelete.id);
      toast.success(`${employeeToDelete.name} has been deleted successfully`);
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
      // Refresh the page to show updated data
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete employee");
    } finally {
      setDeleteLoading(false);
    }
  }

  function openDeleteDialog(employee: any) {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  }

  // Filter and pagination logic
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (emp.designation && emp.designation.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredEmployees.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  // Reset to page 1 when search or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

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

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search employees by name, email, role, department, or designation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
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
            {paginatedEmployees.map((emp) => (
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
                    <div className="flex gap-2 justify-end">
                      {/* <Link href={`/dashboard/profile?userId=${emp.id}`}>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      </Link> */}
                      {emp.role !== "Admin" && (
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="gap-2"
                          onClick={() => openDeleteDialog(emp)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {paginatedEmployees.length === 0 && (
              <TableRow>
                <TableCell 
                  colSpan={canManage ? 6 : 5} 
                  className="text-center py-10 text-muted-foreground italic"
                >
                  {filteredEmployees.length === 0 
                    ? "No employees found matching your search."
                    : "No employees to display."
                  }
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredEmployees.length > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredEmployees.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete <strong>{employeeToDelete?.name}</strong>? This action cannot be undone.
            </p>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm font-medium">This will permanently delete:</p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Employee profile and account</li>
                <li>• All attendance records</li>
                <li>• Payroll history</li>
                <li>• Leave requests</li>
              </ul>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteEmployee}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete Employee"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
