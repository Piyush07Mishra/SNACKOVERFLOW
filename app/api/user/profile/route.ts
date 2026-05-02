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

    // Update user profile
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        name: data.name || undefined,
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
        basicSalary: data.basicSalary || undefined,
        salaryStructure: data.salaryStructure || undefined,
        bankDetails: {
          bankName: data.bankDetails?.bankName || undefined,
          accountNumber: data.bankDetails?.accountNumber || undefined,
          ifscCode: data.bankDetails?.ifscCode || undefined,
          branchName: data.bankDetails?.branchName || undefined,
          panNo: data.bankDetails?.panNo || undefined,
          uanNo: data.bankDetails?.uanNo || undefined,
        },
      },
      { new: true }
    );

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
