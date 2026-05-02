"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const identifier = formData.get("identifier") as string;
    const password = formData.get("password") as string;
    
    const result = await signIn("credentials", {
      identifier,
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
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-sm border-gray-200 shadow-sm rounded-none">
        <CardHeader className="space-y-6 pb-8">
          <div className="mx-auto flex h-12 w-48 items-center justify-center rounded-md bg-gray-200 text-sm font-medium text-gray-500">
            App/Web Logo
          </div>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-1">
              <Label htmlFor="identifier" className="text-gray-700">Login Id/Email :-</Label>
              <Input 
                id="identifier" 
                name="identifier" 
                type="text" 
                className="rounded-md border-gray-400 focus-visible:ring-1 focus-visible:ring-purple-500" 
                required 
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="password" className="text-gray-700">Password :-</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                className="rounded-md border-gray-400 focus-visible:ring-1 focus-visible:ring-purple-500" 
                required 
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-6 pb-8">
            <Button 
              type="submit" 
              className="w-full bg-[#d671f5] hover:bg-[#c25ce0] text-white font-medium uppercase tracking-wider rounded-md" 
              disabled={loading}
            >
              {loading ? "Logging in..." : "SIGN IN"}
            </Button>
            <div className="text-xs text-center text-gray-600">
              Don't have an Account?{" "}
              <Link href="/register" className="text-gray-900 hover:underline">
                Sign Up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
