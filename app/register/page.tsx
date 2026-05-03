"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Eye, EyeOff } from "lucide-react";

const registerSchema = z.object({
  companyName: z.string().trim().min(2, "Company Name must be at least 2 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, "Invalid phone number"),
  password: z.string()
    .min(8, "Min 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[0-9]/, "Must contain number")
    .regex(/[^A-Za-z0-9]/, "Must contain special character"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const result = registerSchema.safeParse(data);
    
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        formattedErrors[String(issue.path[0])] = issue.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: result.data.companyName,
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          email: result.data.email,
          password: result.data.password,
          phone: result.data.phone
        }),
      });

      if (res.ok) {
        toast.success("Registration successful! Please login.");
        router.push("/login");
      } else {
        const resData = await res.json();
        toast.error(resData.error || "Registration failed");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white p-4 py-10">
      <div className="w-full max-w-[440px] border border-gray-200 rounded-2xl shadow-sm overflow-hidden bg-white">
        <form onSubmit={onSubmit}>
          <div className="p-6 md:p-8 pb-6">
            <div className="space-y-2 mb-6 text-center">
              <div className="mx-auto w-48 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 font-medium mb-6">
                App/Web Logo
              </div>
            </div>
            <div className="space-y-3">
              
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-base font-semibold text-black">Company Name</Label>
                <div className="flex gap-2">
                  <Input 
                    id="companyName" 
                    name="companyName" 
                    placeholder="Acme Corp" 
                    className={`rounded-xl h-10 shadow-sm text-black focus-visible:ring-gray-300 ${errors.companyName ? 'border-red-500' : 'border-gray-200'}`} 
                  />
                  <Button type="button" variant="outline" className="h-10 w-10 rounded-xl bg-[#1a1a1a] hover:bg-black text-white border-0 flex-shrink-0">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                {errors.companyName && <p className="text-sm text-red-500">{errors.companyName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-base font-semibold text-black">First Name</Label>
                  <Input 
                    id="firstName" 
                    name="firstName" 
                    placeholder="John" 
                    className={`rounded-xl h-10 shadow-sm text-black focus-visible:ring-gray-300 ${errors.firstName ? 'border-red-500' : 'border-gray-200'}`} 
                  />
                  {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-base font-semibold text-black">Last Name</Label>
                  <Input 
                    id="lastName" 
                    name="lastName" 
                    placeholder="Doe" 
                    className={`rounded-xl h-10 shadow-sm text-black focus-visible:ring-gray-300 ${errors.lastName ? 'border-red-500' : 'border-gray-200'}`} 
                  />
                  {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-semibold text-black">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  className={`rounded-xl h-10 shadow-sm text-black focus-visible:ring-gray-300 ${errors.email ? 'border-red-500' : 'border-gray-200'}`} 
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-base font-semibold text-black">Phone</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  placeholder="+1234567890" 
                  className={`rounded-xl h-10 shadow-sm text-black focus-visible:ring-gray-300 ${errors.phone ? 'border-red-500' : 'border-gray-200'}`} 
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="password" className="text-base font-semibold text-black">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    className={`rounded-xl h-10 shadow-sm pr-10 text-black focus-visible:ring-gray-300 ${errors.password ? 'border-red-500' : 'border-gray-200'}`} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-100 p-1.5 rounded-md"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="confirmPassword" className="text-base font-semibold text-black">Confirm Password</Label>
                <div className="relative">
                  <Input 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"} 
                    className={`rounded-xl h-10 shadow-sm pr-10 text-black focus-visible:ring-gray-300 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'}`} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-100 p-1.5 rounded-md"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>

            </div>
          </div>
          <div className="border-t border-gray-200 p-6 md:px-8 md:py-6 bg-gray-50/30 space-y-4">
            <Button 
              type="submit" 
              className="w-full rounded-xl h-11 bg-[#1a1a1a] hover:bg-black text-white text-base font-medium shadow-md transition-all" 
              disabled={loading}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </Button>
            <div className="text-sm text-center text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-black hover:underline">
                Sign In
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
