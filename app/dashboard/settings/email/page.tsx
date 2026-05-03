import { auth } from "@/auth";
import { redirect } from "next/navigation";
import EmailSettingsClient from "./client";

async function getEmailLogs() {
  // Import here to avoid circular dependency
  const { emailService } = await import("@/lib/customEmailService");
  return emailService.getEmailLogs();
}

async function getEmailStats() {
  // Import here to avoid circular dependency
  const { emailService } = await import("@/lib/customEmailService");
  return emailService.getEmailStats();
}

export default async function EmailSettingsPage() {
  const session = await auth();
  if (!session?.user || !["Admin"].includes((session.user as any).role)) {
    redirect("/dashboard");
  }

  const emailLogs = await getEmailLogs();
  const emailStats = await getEmailStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Settings</h1>
        <p className="text-muted-foreground">
          Manage email notifications and view email logs
        </p>
      </div>

      <EmailSettingsClient 
        initialLogs={emailLogs} 
        initialStats={emailStats}
      />
    </div>
  );
}
