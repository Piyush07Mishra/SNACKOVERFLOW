import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const data = await request.json();

    // Get current user
    const currentUser = await User.findOne({ email: session.user.email });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is trying to update salary
    if (data.basicSalary !== undefined || data.salaryStructure !== undefined) {
      if (currentUser.role !== "Admin" && currentUser.role !== "Payroll_Officer") {
        return NextResponse.json(
          { error: "Only Admin or Payroll Officer can update salary information" },
          { status: 403 }
        );
      }
    }

    // Check if user is trying to update role
    if (data.role !== undefined && data.role !== currentUser.role) {
      if (currentUser.role !== "Admin") {
        return NextResponse.json(
          { error: "Only Admin can change user roles" },
          { status: 403 }
        );
      }
    }

    // Build update object
    const updateData: any = {
      name: data.name !== undefined ? data.name : currentUser.name,
      jobPosition: data.jobPosition || undefined,
      mobileNumber: data.mobileNumber || undefined,
      company: data.company || undefined,
      department: data.department || undefined,
      manager: data.manager || undefined,
      location: data.location || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      residingAddress: data.residingAddress || undefined,
      nationality: data.nationality || undefined,
      personalEmail: data.personalEmail || undefined,
      gender: data.gender || undefined,
      maritalStatus: data.maritalStatus || undefined,
      bankDetails: {
        bankName: data.bankDetails?.bankName || undefined,
        accountNumber: data.bankDetails?.accountNumber || undefined,
        ifscCode: data.bankDetails?.ifscCode || undefined,
        branchName: data.bankDetails?.branchName || undefined,
        panNo: data.bankDetails?.panNo || undefined,
        uanNo: data.bankDetails?.uanNo || undefined,
      },
    };

    // Only admin or payroll officer can update salary
    if (currentUser.role === "Admin" || currentUser.role === "Payroll_Officer") {
      if (data.basicSalary !== undefined) {
        updateData.basicSalary = data.basicSalary;
      }
      if (data.salaryStructure !== undefined) {
        updateData.salaryStructure = data.salaryStructure;
      }
    }

    // Only admin can update role
    if (currentUser.role === "Admin" && data.role !== undefined) {
      updateData.role = data.role;
    }

    // Update user profile
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      updateData,
      { new: true }
    );

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
