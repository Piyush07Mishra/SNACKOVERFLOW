import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const admin = await User.findOne({ email: session.user.email });

    if (admin?.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const user = await User.findById(params.userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user.adminPermissions || {});
  } catch (error) {
    console.error("Admin access GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const admin = await User.findOne({ email: session.user.email });

    if (admin?.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { adminPermissions } = await request.json();

    const user = await User.findByIdAndUpdate(
      params.userId,
      { adminPermissions },
      { new: true }
    );

    return NextResponse.json(user?.adminPermissions || {});
  } catch (error) {
    console.error("Admin access PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
