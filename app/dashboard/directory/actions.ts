"use server";

import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";

export async function createEmployee(data: any) {
  const session = await auth();
  if (!session || !["Admin", "HR_Officer"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  await dbConnect();
  const hashedPassword = await bcrypt.hash("password123", 10);

  await User.create({
    ...data,
    password: hashedPassword,
  });

  revalidatePath("/dashboard/directory");
}

export async function updateEmployee(id: string, data: any) {
  const session = await auth();
  if (!session || !["Admin", "HR_Officer"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  await dbConnect();
  await User.findByIdAndUpdate(id, data);
  
  revalidatePath("/dashboard/directory");
}

export async function deleteEmployee(id: string) {
  const session = await auth();
  if (!session?.user || session.user.id === id || !["Admin", "HR_Officer"].includes((session.user as any).role)) {
    throw new Error("Unauthorized");
  }

  await dbConnect();
  await User.findByIdAndDelete(id);

  revalidatePath("/dashboard/directory");
}
