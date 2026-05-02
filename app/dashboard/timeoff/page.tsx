import dbConnect from "@/lib/mongodb";
import { Leave } from "@/lib/models/Leave";
import { auth } from "@/auth";
import { TimeOffClient } from "./client";

export default async function TimeOffPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const userRole = (session?.user as any)?.role;

  await dbConnect();
  
  let leaveRequests = [];

  if (["Admin", "Payroll_Officer", "HR_Officer"].includes(userRole)) {
    leaveRequests = await Leave.find({}).sort({ createdAt: -1 }).populate("user", "name email").lean();
  } else {
    leaveRequests = await Leave.find({ user: userId }).sort({ createdAt: -1 }).populate("user", "name email").lean();
  }

  const serializedRequests = leaveRequests.map((req: any) => ({
    id: req._id.toString(),
    userName: req.user?.name || "Unknown",
    type: req.type,
    startDate: new Date(req.startDate).toLocaleDateString(),
    endDate: new Date(req.endDate).toLocaleDateString(),
    reason: req.reason,
    status: req.status,
  }));

  const canApprove = ["Admin", "Payroll_Officer"].includes(userRole);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time Off Management</h1>
          <p className="text-muted-foreground">Manage and track leave requests.</p>
        </div>
      </div>

      <TimeOffClient requests={serializedRequests} canApprove={canApprove} />
    </div>
  );
}
