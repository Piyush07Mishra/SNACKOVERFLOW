import { NextResponse } from "next/dist/server/web/spec-extension/response";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await dbConnect();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // If it's the first user ever, make them an Admin
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? "Admin" : (role || "Employee");

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: assignedRole,
    });

    return NextResponse.json(
      { message: "User registered successfully", user: { id: user._id, email: user.email, role: user.role } },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
