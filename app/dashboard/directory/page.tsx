import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { auth } from "@/auth";
import { DirectoryClient } from "./client";

export default async function DirectoryPage() {
  const session = await auth();
  const userRole = (session?.user as any)?.role;

  await dbConnect();
  
  const employees = await User.find({}).sort({ createdAt: -1 }).lean();
  
  const serializedEmployees = employees.map(emp => ({
    id: emp._id.toString(),
    name: emp.name,
    email: emp.email,
    role: emp.role,
    designation: emp.designation,
    department: emp.department,
    basicSalary: emp.basicSalary,
  }));

  const canManage = ["Admin", "HR_Officer"].includes(userRole);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Directory</h1>
          <p className="text-muted-foreground">Manage and view employee information.</p>
        </div>
      </div>
      
      <DirectoryClient employees={serializedEmployees} canManage={canManage} />
    </div>
  );
}
