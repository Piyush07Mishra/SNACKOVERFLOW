import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { emailService } from "@/lib/customEmailService";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["Admin"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const logs = emailService.getEmailLogs();
    const stats = emailService.getEmailStats();

    return NextResponse.json({ 
      logs,
      stats
    });

  } catch (error) {
    console.error("Email logs fetch error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["Admin"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    emailService.clearEmailLogs();

    return NextResponse.json({ 
      success: true,
      message: "Email logs cleared successfully"
    });

  } catch (error) {
    console.error("Email logs clear error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
