
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, ScanLine, FileText, History, Bot, Layers, User, Briefcase, TrendingUp } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useUser } from "@/firebase";
import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/icons";
import AppHeader from "@/components/app-header";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/analysis", label: "Leaf Analysis", icon: ScanLine },
  { href: "/soil", label: "Soil Analysis", icon: Layers },
  { href: "/reports", label: "Risk Reports", icon: FileText },
  { href: "/history", label: "Checkup History", icon: History },
  { href: "/recommendation", label: "Crop Recommendation", icon: Briefcase },
  { href: "/yield-prediction", label: "Yield Prediction", icon: TrendingUp },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
  { href: "/account", label: "My Account", icon: User },
];

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) return; // Wait until user state is resolved

    if (!user) {
      router.replace(`/login?redirect=${pathname}`);
    }
  }, [isUserLoading, user, router, pathname]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Logo className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-headline font-bold text-sidebar-foreground">
              Field Master
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  className="w-full"
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="p-2 w-full text-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground text-sm flex items-center justify-center gap-2">
            <Bot />
            <span>AI Analysis Active</span>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
             <div className="flex h-screen w-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return <ProtectedLayout>{children}</ProtectedLayout>;
}
