"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const companyName = formData.get("companyName") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, name, email, phone, password }),
      });

      if (res.ok) {
        toast.success("Registration successful! Please login.");
        router.push("/login");
      } else {
        const data = await res.json();
        toast.error(data.error || "Registration failed");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md border-gray-200 shadow-sm rounded-none">
        <CardHeader className="space-y-6 pb-8">
          <div className="mx-auto flex h-12 w-48 items-center justify-center rounded-md bg-gray-200 text-sm font-medium text-gray-500">
            App/Web Logo
          </div>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Label htmlFor="companyName" className="w-32 flex-shrink-0">Company Name :-</Label>
              <div className="flex w-full items-center gap-2">
                <Input id="companyName" name="companyName" className="rounded-none border-b border-l-0 border-r-0 border-t-0 border-gray-400 bg-transparent px-0 focus-visible:ring-0" required />
                <Button type="button" size="icon" className="h-8 w-8 rounded-sm bg-blue-600 hover:bg-blue-700 flex-shrink-0">
                  <Upload className="h-4 w-4" />
                  <span className="sr-only">Upload Logo</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="name" className="w-32 flex-shrink-0">Name :-</Label>
              <Input id="name" name="name" className="rounded-none border-b border-l-0 border-r-0 border-t-0 border-gray-400 bg-transparent px-0 focus-visible:ring-0" required />
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="email" className="w-32 flex-shrink-0">Email :-</Label>
              <Input id="email" name="email" type="email" className="rounded-none border-b border-l-0 border-r-0 border-t-0 border-gray-400 bg-transparent px-0 focus-visible:ring-0" required />
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="phone" className="w-32 flex-shrink-0">Phone :-</Label>
              <Input id="phone" name="phone" type="tel" className="rounded-none border-b border-l-0 border-r-0 border-t-0 border-gray-400 bg-transparent px-0 focus-visible:ring-0" required />
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="password" className="w-32 flex-shrink-0">Password :-</Label>
              <div className="relative flex w-full items-center">
                <Input id="password" name="password" type={showPassword ? "text" : "password"} className="rounded-none border-b border-l-0 border-r-0 border-t-0 border-gray-400 bg-transparent px-0 pr-8 focus-visible:ring-0" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 flex h-full items-center justify-center text-gray-400 hover:text-gray-600 bg-gray-100 px-2 rounded-sm h-6">
                  {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="confirmPassword" className="w-32 flex-shrink-0">Confirm Password :-</Label>
              <div className="relative flex w-full items-center">
                <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} className="rounded-none border-b border-l-0 border-r-0 border-t-0 border-gray-400 bg-transparent px-0 pr-8 focus-visible:ring-0" required />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-0 flex h-full items-center justify-center text-gray-400 hover:text-gray-600 bg-gray-100 px-2 rounded-sm h-6">
                  {showConfirmPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-6 pt-4 pb-8">
            <Button type="submit" className="w-full bg-[#d671f5] hover:bg-[#c25ce0] text-white rounded-md" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
            <div className="text-xs text-center text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-gray-900 hover:underline">
                Sign In
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
