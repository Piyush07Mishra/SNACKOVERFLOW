import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import EmailService from "@/lib/customEmailService";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["Admin"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const smtpConfig = await request.json();

    // Create a temporary email service instance with the provided config
    const tempEmailService = new EmailService(smtpConfig);

    const isConnected = await tempEmailService.testConnection();

    return NextResponse.json({ 
      success: isConnected,
      message: isConnected ? "Connection successful" : "Connection failed"
    });

  } catch (error) {
    console.error("Email test error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
