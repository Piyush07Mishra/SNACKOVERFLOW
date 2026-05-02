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
import { applyForLeave, updateLeaveStatus } from "./actions";

export function TimeOffClient({ requests, canApprove }: { requests: any[], canApprove: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      type: formData.get("type"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      reason: formData.get("reason"),
    };

    try {
      await applyForLeave(data);
      toast.success("Leave applied successfully");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to apply for leave");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatus(id: string, status: "Approved" | "Rejected") {
    try {
      await updateLeaveStatus(id, status);
      toast.success(`Leave request ${status.toLowerCase()}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update leave");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Apply for Time Off</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Leave Type</Label>
                <Select name="type" defaultValue="Casual" required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sick">Sick Leave</SelectItem>
                    <SelectItem value="Casual">Casual Leave</SelectItem>
                    <SelectItem value="Earned">Earned Leave</SelectItem>
                    <SelectItem value="Unpaid">Unpaid Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input name="startDate" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input name="endDate" type="date" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Input name="reason" required />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              {canApprove && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell className="font-medium">{req.userName}</TableCell>
                <TableCell>{req.type}</TableCell>
                <TableCell>{req.startDate} to {req.endDate}</TableCell>
                <TableCell>{req.reason}</TableCell>
                <TableCell>
                  <Badge variant={req.status === "Approved" ? "default" : req.status === "Rejected" ? "destructive" : "secondary"}>
                    {req.status}
                  </Badge>
                </TableCell>
                {canApprove && (
                  <TableCell className="text-right">
                    {req.status === "Pending" && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleStatus(req.id, "Approved")}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleStatus(req.id, "Rejected")}>Reject</Button>
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={canApprove ? 6 : 5} className="text-center py-4 text-muted-foreground">
                  No time-off requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
