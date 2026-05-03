import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { ProfileClient } from "./client";
import { DynamicPageTitle } from "@/components/DynamicPageTitle";
import { generateMetadata as generatePageMetadata } from "@/lib/getPageTitle";
import { Metadata } from "next";


export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { userId?: string };
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  await connectDB();
  const currentUser = await User.findOne({ email: session.user.email }).lean();

  if (!currentUser) {
    redirect("/login");
  }

  const currentUserIsAdmin = currentUser.role === "Admin";
  const currentUserIsPayrollOfficer = currentUser.role === "Payroll_Officer";
  const isAdmin = currentUserIsAdmin;

  // If userId is provided and user is Admin/Payroll Officer, fetch that user's profile
  let viewingUser = currentUser;
  let isOtherUserProfile = false;

  if (searchParams.userId && (currentUserIsAdmin || currentUserIsPayrollOfficer)) {
    const otherUser = await User.findById(searchParams.userId).lean();
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
    <>
      <DynamicPageTitle 
        userName={viewingUser.name}
        employeeId={viewingUser.employeeId}
        customTitle={isOtherUserProfile ? `${viewingUser.name}'s Profile` : viewingUser.name ? `Profile: ${viewingUser.name}` : 'Profile'}
      />
      <ProfileClient
        initialData={JSON.parse(JSON.stringify(viewingUser))}
        isAdmin={isAdmin}
        canEditSalary={canEditSalary}
        canEditRole={canEditRole}
        canEditProfile={canEditProfile}
        isOtherUserProfile={isOtherUserProfile}
        userRole={currentUser.role}
      />
    </>
  );
}
