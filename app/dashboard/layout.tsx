import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardLayout } from "@/components/DashboardLayout";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardLayout user={{ id: session.user.id || "", name: session.user.name, email: session.user.email, role: (session.user as any).role }}>
      {children}
    </DashboardLayout>
  );
}
