import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/User';

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin can manage users
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || currentUser.role !== "Admin") {
      return NextResponse.json({ error: "Only Admin can manage users" }, { status: 403 });
    }

    await connectDB();
    const data = await request.json();
    const { userId, ...updateFields } = data;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Find the target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent editing another Admin unless you're the same user
    if (targetUser.role === "Admin" && targetUser._id.toString() !== currentUser._id.toString()) {
      return NextResponse.json({ error: "Cannot edit another Admin user" }, { status: 403 });
    }

    // Build update object with only allowed fields
    const updateData: any = {};

    // Basic info updates
    if (updateFields.name !== undefined) updateData.name = updateFields.name;
    if (updateFields.email !== undefined) updateData.email = updateFields.email;
    if (updateFields.designation !== undefined) updateData.designation = updateFields.designation;
    if (updateFields.department !== undefined) updateData.department = updateFields.department;
    if (updateFields.basicSalary !== undefined) updateData.basicSalary = updateFields.basicSalary;

    // Role changes - only Admin can change roles (but not to Admin for others)
    if (updateFields.role !== undefined) {
      if (updateFields.role === "Admin" && targetUser._id.toString() !== currentUser._id.toString()) {
        return NextResponse.json({ error: "Cannot assign Admin role to other users" }, { status: 403 });
      }
      updateData.role = updateFields.role;
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("User management error:", error);
    if (error.code === 11000) {
      // Duplicate key error (likely email)
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
