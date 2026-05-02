import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { NextRequest, NextResponse } from "next/server";
import { calculateSalaryComponents } from "@/lib/salaryCalculations";

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
    const { userId, ...updateFields } = data;

    // Get current user
    const currentUser = await User.findOne({ email: session.user.email });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine which user to update
    let targetUser;
    if (userId && (currentUser.role === "Admin" || currentUser.role === "Payroll_Officer")) {
      // Admin/Payroll officer is editing another user
      targetUser = await User.findById(userId);
      if (!targetUser) {
        return NextResponse.json({ error: "Target user not found" }, { status: 404 });
      }
    } else {
      // User is editing their own profile
      targetUser = currentUser;
    }

    // Check if user is trying to update salary
    if (updateFields.basicSalary !== undefined || updateFields.salaryComponents !== undefined || updateFields.salaryConfig !== undefined) {
      if (currentUser.role !== "Admin" && currentUser.role !== "Payroll_Officer") {
        return NextResponse.json(
          { error: "Only Admin or Payroll Officer can update salary information" },
          { status: 403 }
        );
      }
    }

    // Check if user is trying to update role
    if (updateFields.role !== undefined && updateFields.role !== targetUser.role) {
      if (currentUser.role !== "Admin") {
        return NextResponse.json(
          { error: "Only Admin can change user roles" },
          { status: 403 }
        );
      }
    }

    // Calculate salary components if basicSalary is provided
    let calculatedComponents = updateFields.salaryComponents;
    if (updateFields.salaryComponents && updateFields.basicSalary !== undefined) {
      calculatedComponents = calculateSalaryComponents(
        updateFields.salaryComponents,
        updateFields.basicSalary
      );
    }

    // Build update object
    const updateData: any = {
      name: updateFields.name !== undefined ? updateFields.name : targetUser.name,
      jobPosition: updateFields.jobPosition !== undefined ? updateFields.jobPosition : targetUser.jobPosition,
      mobileNumber: updateFields.mobileNumber !== undefined ? updateFields.mobileNumber : targetUser.mobileNumber,
      company: updateFields.company !== undefined ? updateFields.company : targetUser.company,
      department: updateFields.department !== undefined ? updateFields.department : targetUser.department,
      manager: updateFields.manager !== undefined ? updateFields.manager : targetUser.manager,
      location: updateFields.location !== undefined ? updateFields.location : targetUser.location,
      dateOfBirth: updateFields.dateOfBirth !== undefined ? updateFields.dateOfBirth : targetUser.dateOfBirth,
      residingAddress: updateFields.residingAddress !== undefined ? updateFields.residingAddress : targetUser.residingAddress,
      nationality: updateFields.nationality !== undefined ? updateFields.nationality : targetUser.nationality,
      personalEmail: updateFields.personalEmail !== undefined ? updateFields.personalEmail : targetUser.personalEmail,
      gender: updateFields.gender !== undefined ? updateFields.gender : targetUser.gender,
      maritalStatus: updateFields.maritalStatus !== undefined ? updateFields.maritalStatus : targetUser.maritalStatus,
    };

    // Update bank details if provided
    if (updateFields.bankDetails) {
      updateData.bankDetails = {
        bankName: updateFields.bankDetails.bankName !== undefined ? updateFields.bankDetails.bankName : targetUser.bankDetails?.bankName,
        accountNumber: updateFields.bankDetails.accountNumber !== undefined ? updateFields.bankDetails.accountNumber : targetUser.bankDetails?.accountNumber,
        ifscCode: updateFields.bankDetails.ifscCode !== undefined ? updateFields.bankDetails.ifscCode : targetUser.bankDetails?.ifscCode,
        branchName: updateFields.bankDetails.branchName !== undefined ? updateFields.bankDetails.branchName : targetUser.bankDetails?.branchName,
        panNo: updateFields.bankDetails.panNo !== undefined ? updateFields.bankDetails.panNo : targetUser.bankDetails?.panNo,
        uanNo: updateFields.bankDetails.uanNo !== undefined ? updateFields.bankDetails.uanNo : targetUser.bankDetails?.uanNo,
      };
    }

    // Only admin or payroll officer can update salary
    if (currentUser.role === "Admin" || currentUser.role === "Payroll_Officer") {
      if (updateFields.basicSalary !== undefined) {
        updateData.basicSalary = updateFields.basicSalary;
      }
      if (updateFields.wageType !== undefined) {
        updateData.wageType = updateFields.wageType;
      }
      if (calculatedComponents) {
        updateData.salaryComponents = calculatedComponents;
      }
      if (updateFields.salaryConfig !== undefined) {
        updateData.salaryConfig = updateFields.salaryConfig;
      }
    }

    // Only admin can update role
    if (currentUser.role === "Admin" && updateFields.role !== undefined) {
      updateData.role = updateFields.role;
    }

    // Update user profile
    const updatedUser = await User.findOneAndUpdate(
      { _id: targetUser._id },
      updateData,
      { new: true }
    );

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
