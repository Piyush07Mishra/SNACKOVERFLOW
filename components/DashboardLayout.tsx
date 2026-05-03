"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, CalendarDays, Clock, Banknote, Settings, LogOut, Menu, User as UserIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CheckInButton } from "./CheckInButton";
import { DicebearAvatar } from "./DicebearAvatar";
import { NotificationCenter } from "./NotificationCenter";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
}

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Directory", href: "/dashboard/directory", icon: Users },
  { name: "Attendance", href: "/dashboard/attendance", icon: Clock },
  { name: "Time Off", href: "/dashboard/timeoff", icon: CalendarDays },
  { name: "Payroll", href: "/dashboard/payroll", icon: Banknote },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    // Call next-auth signout via route or action
    window.location.href = "/api/auth/signout";
  };

  const NavLinks = () => (
    <div className="flex flex-col gap-2">
      {navItems.map((item) => {
        // Simple role check
        if (item.name === "Dashboard" && !["Admin", "HR_Officer"].includes(user.role || "")) return null;
        if (item.name === "Settings" && user.role !== "Admin") return null;

        const isActive = pathname.startsWith(item.href);
        return (
          <Link key={item.name} href={item.href}>
            <span
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? item.name : ""}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden absolute top-4 left-4 z-40">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 sm:w-75">
          <div className="flex flex-col h-full gap-4">
            <div className="flex h-14 items-center border-b px-4 lg:h-15">
              <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                <span className="text-xl text-primary">EmPay</span>
              </Link>
            </div>
            <div className="flex-1 overflow-auto">
              <NavLinks />
            </div>
            <div className="mt-auto p-4 border-t space-y-4">
              <CheckInButton />
              <Link href="/dashboard/profile">
                <span
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname.startsWith("/dashboard/profile") ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )}
                >
                  <UserIcon className="h-4 w-4" />
                  Profile
                </span>
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar - Fixed Position */}
      <div className={cn(
        "hidden md:block md:fixed md:left-0 md:top-0 md:h-screen md:z-30 transition-all duration-300 ease-in-out",
        isCollapsed ? "md:w-16" : "md:w-64 lg:w-70"
      )}>
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-15 lg:px-6">
            <Link href="/dashboard" className={cn(
              "flex items-center gap-2 font-bold transition-all duration-300",
              isCollapsed && "justify-center"
            )}>
              <span className={cn(
                "text-2xl text-primary transition-all duration-300",
                isCollapsed ? "text-xl" : ""
              )}>
                {isCollapsed ? "E" : "EmPay"}
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto hidden md:flex"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <NavLinks />
            </nav>
          </div>
          <div className={cn(
            "mt-auto border-t space-y-4 transition-all duration-300",
            isCollapsed ? "p-2" : "p-4"
          )}>
            <CheckInButton />
            <Link href="/dashboard/profile">
              <span
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  pathname.startsWith("/dashboard/profile") ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                  isCollapsed && "justify-center px-2"
                )}
                title={isCollapsed ? "Profile" : ""}
              >
                <UserIcon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span>Profile</span>}
              </span>
            </Link>
            <div className={cn(
              "flex items-center gap-3 transition-all duration-300",
              isCollapsed && "flex-col gap-2"
            )}>
              <DicebearAvatar 
                seed={user.email || user.id} 
                name={user.name || "User"} 
                size={36}
                className={cn(
                  "flex-shrink-0",
                  isCollapsed ? "h-8 w-8" : "h-9 w-9"
                )} 
              />
              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.role}</span>
                </div>
              )}
              {!isCollapsed && (
                <Button variant="ghost" size="icon" className="ml-auto" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                </Button>
              )}
              {isCollapsed && (
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                  <LogOut className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - with left margin for fixed sidebar */}
      <main className={cn(
        "flex-1 flex flex-col min-h-screen pt-14 md:pt-0 transition-all duration-300 ease-in-out",
        isCollapsed ? "md:ml-16" : "md:ml-64 lg:ml-70"
      )}>
        {/* Top Bar with Notifications */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between px-4 md:px-8 py-3">
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <NotificationCenter />
            </div>
          </div>
        </div>
        
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
