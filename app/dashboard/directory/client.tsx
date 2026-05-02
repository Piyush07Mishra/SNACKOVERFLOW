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
import { Edit, Download, X } from "lucide-react";
import { createEmployee } from "./actions";
import { generateEmployeeReportPDF } from "@/lib/pdfGenerator";

export function DirectoryClient({ employees, canManage }: { employees: any[], canManage: boolean }) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});

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

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      designation: user.designation || "",
      department: user.department || "",
      basicSalary: user.basicSalary || 0,
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEditLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        userId: selectedUser._id,
        name: formData.get("name"),
        email: formData.get("email"),
        role: formData.get("role"),
        designation: formData.get("designation"),
        department: formData.get("department"),
        basicSalary: Number(formData.get("basicSalary") || 0),
      };

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success("User updated successfully!");
        setEditOpen(false);
        // You might want to refresh the employees list here
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update user");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

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
              <TableHead>Basic Salary</TableHead>
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
                <TableCell>₹{emp.basicSalary ? emp.basicSalary.toLocaleString() : "0"}</TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => handleEditUser(emp)}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit User Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Edit User
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditOpen(false)}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  name="name" 
                  defaultValue={editFormData.name}
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  name="email" 
                  type="email" 
                  defaultValue={editFormData.email}
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label>Role</Label>
                <Select name="role" defaultValue={editFormData.role}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Input 
                  name="designation" 
                  defaultValue={editFormData.designation}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Department</Label>
                <Input 
                  name="department" 
                  defaultValue={editFormData.department}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Basic Salary</Label>
                <Input 
                  name="basicSalary" 
                  type="number" 
                  defaultValue={editFormData.basicSalary}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={editLoading} 
                  className="flex-1"
                >
                  {editLoading ? "Updating..." : "Update User"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
