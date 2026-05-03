import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Company } from "@/lib/models/Company";
import { ProfileClient } from "./client";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  await connectDB();
  const currentUser = await User.findById(session.user.id).lean();

  if (!currentUser) {
    redirect("/login");
  }

  const company = currentUser.companyId ? await Company.findById(currentUser.companyId).lean() : null;

  const currentUserIsAdmin = currentUser.role === "Admin";
  const currentUserIsPayrollOfficer = currentUser.role === "Payroll_Officer";
  const isAdmin = currentUserIsAdmin;

  // If userId is provided and user is Admin/Payroll Officer, fetch that user's profile
  let viewingUser = currentUser;
  let isOtherUserProfile = false;

  const { userId } = await searchParams;
  if (userId && (currentUserIsAdmin || currentUserIsPayrollOfficer)) {
    const otherUser = await User.findOne({ _id: userId, companyId: currentUser.companyId }).lean();
    if (otherUser) {
      viewingUser = otherUser;
      isOtherUserProfile = true;
    }
  }

  // Determine edit permissions based on who is viewing
  let canEditSalary = false;
  let canEditRole = false;
  let canEditProfile = false;

  if (isOtherUserProfile) {
    // Viewing another user's profile
    if (currentUserIsAdmin) {
      canEditRole = true;
      canEditSalary = true;
      canEditProfile = true;
    } else if (currentUserIsPayrollOfficer) {
      canEditSalary = true; // Payroll officers can only edit salary
    }
  } else {
    // Viewing own profile
    canEditProfile = true;
    if (currentUserIsAdmin || currentUserIsPayrollOfficer) {
      canEditSalary = true;
    }
  }

  return (
    <ProfileClient
      initialData={JSON.parse(JSON.stringify({
        ...viewingUser,
        company: company?.name || viewingUser.company || "",
      }))}
      isAdmin={isAdmin}
      canEditSalary={canEditSalary}
      canEditRole={canEditRole}
      canEditProfile={canEditProfile}
      isOtherUserProfile={isOtherUserProfile}
      userRole={currentUser.role}
    />
  );
}
