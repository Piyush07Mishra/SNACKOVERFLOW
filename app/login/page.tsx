"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      toast.error("Invalid credentials or user not found");
      setLoading(false);
    } else if (result?.ok) {
      toast.success("Login successful");
      window.location.href = "/dashboard";
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-white p-4">
      <div className="w-full max-w-[440px] border border-gray-200 rounded-2xl shadow-sm overflow-hidden bg-white">
        <form onSubmit={onSubmit}>
          <div className="p-6 md:p-8 pb-6">
            <div className="space-y-2 mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-black">EmPay Login</h1>
              <p className="text-gray-500 text-base">Enter your credentials to access your account.</p>
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-semibold text-black">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  required 
                  className="rounded-xl border-gray-200 h-11 shadow-sm text-black focus-visible:ring-gray-300" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-semibold text-black">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    className="rounded-xl border-gray-200 h-11 shadow-sm pr-10 text-black focus-visible:ring-gray-300" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-100 p-1.5 rounded-md"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 p-6 md:px-8 md:py-6 bg-gray-50/30 space-y-4">
            <Button 
              type="submit" 
              className="w-full rounded-xl h-12 bg-[#1a1a1a] hover:bg-black text-white text-base font-medium shadow-md transition-all" 
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
            <div className="text-sm text-center text-gray-600">
              Don't have an account?{" "}
              <Link href="/register" className="font-semibold text-black hover:underline">
                Sign up
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
