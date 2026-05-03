"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut } from "lucide-react";

export default function SignOutPage() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <Card className="w-full max-w-lg overflow-hidden border-border/50 bg-card/50 backdrop-blur-xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary/50 via-primary to-primary/50" />
        <CardHeader className="pt-6">
          <CardTitle>Sign Out</CardTitle>
          <CardDescription>
            Are you sure you want to sign out? You will need to sign in again to access your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-3xl border border-border/50 bg-background/80 p-4 text-sm text-muted-foreground">
            Signing out will end your current session on this device. Your company data will remain safe and you can sign back in anytime.
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t border-border/50 py-4 flex flex-col gap-3">
          <Button
            type="button"
            className="w-full gap-2"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                Sign out
              </>
            )}
          </Button>
          <Link href="/dashboard" className="text-center text-sm font-medium text-muted-foreground hover:text-foreground">
            Cancel
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
