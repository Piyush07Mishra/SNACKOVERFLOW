'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { signOut } from 'next-auth/react';
import { Edit, Download, X, Trash2, UserPlus } from 'lucide-react';
import { createEmployee, deleteEmployee } from './actions';
import { generateEmployeeReportPDF } from '@/lib/pdfGenerator';
import { generateEmployeeId } from '@/lib/services/employeeIdService';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Employee {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  basicSalary?: number;
  status?: string;
}

interface DirectoryClientProps {
  employees: Employee[];
  canManage: boolean;
  companyCode?: string; // for ID preview
}

// ─── Component ────────────────────────────────────────────────────────────────
export function DirectoryClient({
  employees,
  canManage,
  companyCode = 'CO',
}: DirectoryClientProps) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Employee | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  // ── Add Employee form state (for ID preview) ───────────────────────────────
  const [previewFirst, setPreviewFirst] = useState('');
  const [previewLast, setPreviewLast] = useState('');
  const [previewDate, setPreviewDate] = useState('');

  const previewId = useMemo(() => {
    if (!previewFirst || !previewLast || !previewDate) return null;
    const year = new Date(previewDate).getFullYear();
    if (isNaN(year)) return null;
    // Serial shown as ???? since we don't know the exact number client-side
    return generateEmployeeId(companyCode, previewFirst, previewLast, year, 0).replace(
      '0000',
      '????'
    );
  }, [previewFirst, previewLast, previewDate, companyCode]);

  // ── Submit new employee ────────────────────────────────────────────────────
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      await createEmployee({
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        email: formData.get('email') as string,
        joiningDate: formData.get('joiningDate') as string,
        role: formData.get('role') as string,
        designation: formData.get('designation') as string,
        department: formData.get('department') as string,
        basicSalary: Number(formData.get('basicSalary') || 0),
      });
      toast.success('Employee created! Welcome email sent.');
      setOpen(false);
      setPreviewFirst('');
      setPreviewLast('');
      setPreviewDate('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  }

  // ── Download report ────────────────────────────────────────────────────────
  function handleDownloadReport() {
    try {
      generateEmployeeReportPDF(employees, 'Employee Directory Report');
      toast.success('Report downloaded successfully!');
    } catch {
      toast.error('Failed to download report');
    }
  }

  const handleEditUser = (user: Employee) => {
    setSelectedUser(user);
    setEditFormData({
      firstName: user.firstName || user.name?.split(' ')[0] || '',
      lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
      email: user.email,
      role: user.role,
      designation: user.designation || '',
      department: user.department || '',
      basicSalary: user.basicSalary || 0,
    });
    setEditOpen(true);
  };

  const handleDeleteUser = async (user: Employee) => {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) {
      return;
    }

    setDeleteLoading(true);
    try {
      const result = await deleteEmployee(user._id);
      if (result?.deletedSelf) {
        toast.success('Admin deleted. Signing out...');
        await signOut({ callbackUrl: '/register' });
        return;
      }

      toast.success('Employee deleted successfully!');
      setEditOpen(false);
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete employee');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEditLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        userId: selectedUser!._id,
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        role: formData.get('role'),
        designation: formData.get('designation'),
        department: formData.get('department'),
        basicSalary: Number(formData.get('basicSalary') || 0),
      };

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Employee updated successfully!');
        setEditOpen(false);
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update employee');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update employee');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleDownloadReport} className="gap-2">
          <Download className="h-4 w-4" />
          Download Report
        </Button>

        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>
                  Create a new employee record for this company.
                </DialogDescription>
              </DialogHeader>

              {/* ── ID Preview badge ──────────────────────────────────── */}
              {previewId && (
                <div className="rounded-md border border-dashed px-4 py-3 text-center">
                  <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide">
                    Preview Employee ID
                  </p>
                  <p className="font-mono text-lg font-bold tracking-widest">
                    {previewId}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Exact serial assigned on save
                  </p>
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-3">
                {/* Row: First + Last name */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="firstName"
                      required
                      value={previewFirst}
                      onChange={(e) => setPreviewFirst(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="lastName"
                      required
                      value={previewLast}
                      onChange={(e) => setPreviewLast(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input name="email" type="email" required />
                </div>

                <div className="space-y-1">
                  <Label>
                    Joining Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="joiningDate"
                    type="date"
                    required
                    value={previewDate}
                    onChange={(e) => setPreviewDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Role</Label>
                  <Select name="role" defaultValue="Employee">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Employee">Employee</SelectItem>
                      <SelectItem value="HR_Officer">HR Officer</SelectItem>
                      <SelectItem value="Payroll_Officer">
                        Payroll Officer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Designation</Label>
                    <Input name="designation" />
                  </div>
                  <div className="space-y-1">
                    <Label>Department</Label>
                    <Input name="department" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Basic Salary (₹)</Label>
                  <Input name="basicSalary" type="number" min="0" />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creating...' : 'Create Employee'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* ── Employee Table ────────────────────────────────────────────────── */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Basic Salary</TableHead>
              {canManage && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp) => (
              <TableRow key={emp._id}>
                <TableCell>
                  <span className="font-mono text-sm font-semibold">
                    {emp.employeeId || '—'}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{emp.name}</TableCell>
                <TableCell>{emp.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={emp.role === 'Admin' ? 'default' : 'secondary'}
                  >
                    {emp.role.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>{emp.department || '—'}</TableCell>
                <TableCell>{emp.designation || '—'}</TableCell>
                <TableCell>
                  ₹{emp.basicSalary ? emp.basicSalary.toLocaleString() : '0'}
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => handleEditUser(emp)}
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-2"
                        onClick={() => handleDeleteUser(emp)}
                        disabled={deleteLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {employees.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 8 : 7}
                  className="text-muted-foreground py-12 text-center"
                >
                  No employees yet. Add your first employee to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Edit Employee
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditOpen(false)}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              Update employee details, role, and salary information.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <form onSubmit={handleEditSubmit} className="space-y-3">
              {selectedUser.employeeId && (
                <div className="rounded-md bg-muted px-3 py-2">
                  <span className="text-muted-foreground text-xs">Employee ID:&nbsp;</span>
                  <span className="font-mono text-sm font-bold">{selectedUser.employeeId}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>First Name</Label>
                  <Input name="firstName" defaultValue={editFormData.firstName} />
                </div>
                <div className="space-y-1">
                  <Label>Last Name</Label>
                  <Input name="lastName" defaultValue={editFormData.lastName} />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Email</Label>
                <Input name="email" type="email" defaultValue={editFormData.email} required />
              </div>

              <div className="space-y-1">
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Designation</Label>
                  <Input name="designation" defaultValue={editFormData.designation} />
                </div>
                <div className="space-y-1">
                  <Label>Department</Label>
                  <Input name="department" defaultValue={editFormData.department} />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Basic Salary (₹)</Label>
                <Input name="basicSalary" type="number" defaultValue={editFormData.basicSalary} />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => selectedUser && handleDeleteUser(selectedUser)}
                  disabled={deleteLoading}
                  className="w-full"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Employee'}
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={editLoading} className="flex-1">
                    {editLoading ? 'Updating...' : 'Update Employee'}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
