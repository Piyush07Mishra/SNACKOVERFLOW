import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";

async function testLogin(email, password) {
  await dbConnect();
  const user = await User.findOne({ email });
  if (!user) {
    console.log("User not found");
    return;
  }
  console.log("User found:", user.email);
  const isPasswordValid = await bcrypt.compare(password, user.password);
  console.log("Password valid:", isPasswordValid);
}

testLogin("test@example.com", "password123").then(() => process.exit(0)).catch(console.error);
