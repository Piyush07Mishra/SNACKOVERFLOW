import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { ProfileClient } from "./client";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  await connectDB();
  const user = await User.findOne({ email: session.user.email }).lean();

  if (!user) {
    redirect("/login");
  }

  const isAdmin = user.role === "Admin";

  return <ProfileClient initialData={JSON.parse(JSON.stringify(user))} isAdmin={isAdmin} />;
}
