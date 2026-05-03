import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const admin = await User.findById(session.user.id);

    if (admin?.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if both users belong to the same company
    if (admin.companyId?.toString() !== user.companyId?.toString()) {
      return NextResponse.json({ error: "Cannot manage users from different companies" }, { status: 403 });
    }

    return NextResponse.json(user.adminPermissions || {});
  } catch (error) {
    console.error("Admin access GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const admin = await User.findById(session.user.id);

    if (admin?.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if both users belong to the same company
    if (admin.companyId?.toString() !== targetUser.companyId?.toString()) {
      return NextResponse.json({ error: "Cannot manage users from different companies" }, { status: 403 });
    }

    const { adminPermissions } = await request.json();

    const user = await User.findByIdAndUpdate(
      userId,
      { adminPermissions },
      { new: true }
    );

    return NextResponse.json(user?.adminPermissions || {});
  } catch (error) {
    console.error("Admin access PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
