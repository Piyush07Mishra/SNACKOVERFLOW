import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Company } from "@/lib/models/Company";
import { generateEmployeeId } from "@/lib/utils/generateEmployeeId";

export async function POST(req: Request) {
  try {
    const { companyName, name, email, phone, password } = await req.json();

    if (!companyName || !name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create Company
    const company = await Company.create({
      name: companyName,
      email: email, // Using the admin's email as the initial company contact email
      phone: phone || '',
    });

    // 2. Generate Login ID (employeeId)
    const joinYear = new Date().getFullYear();
    const employeeId = generateEmployeeId(companyName, name, joinYear, 1);

    // 3. Create Admin User
    const user = await User.create({
      companyId: company._id,
      employeeId,
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      role: 'ADMIN',
    });

    return NextResponse.json(
      { 
        message: "Registration successful", 
        user: { 
          id: user._id, 
          email: user.email, 
          role: user.role,
          employeeId: user.employeeId
        } 
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
