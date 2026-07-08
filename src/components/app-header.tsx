
"use client";

import Link from "next/link";
import { Bell, Mail, Moon, Sun, User, Settings } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function ThemeToggler() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between w-full">
        <span>{theme === 'dark' ? 'Dark' : 'Light'} Mode</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
}

function ContactAdminDialog() {
    const adminEmail = "karrisrichaitanya@gmail.com";
    const subject = "Inquiry from Field Master App";

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${adminEmail}&su=${encodeURIComponent(subject)}`;
    const outlookUrl = `https://outlook.live.com/owa/?path=/mail/action/compose&to=${adminEmail}&subject=${encodeURIComponent(subject)}`;
    const mailtoUrl = `mailto:${adminEmail}?subject=${encodeURIComponent(subject)}`;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                    <Mail className="mr-2" /> Contact Admin
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Contact Admin</DialogTitle>
                    <DialogDescription>
                        Choose your preferred email client to send a message to the administrator.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Button asChild>
                        <a href={gmailUrl} target="_blank" rel="noopener noreferrer">
                            Open in Gmail
                        </a>
                    </Button>
                    <Button asChild variant="outline">
                        <a href={outlookUrl} target="_blank" rel="noopener noreferrer">
                            Open in Outlook
                        </a>
                    </Button>
                    <Button asChild variant="secondary">
                        <a href={mailtoUrl}>
                            Use Default Email App
                        </a>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}


export default function AppHeader() {
  
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        {/* Can add breadcrumbs or page title here */}
      </div>
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <div className="flex flex-col">
                <p className="font-semibold">New Pest Alert: Sector 4</p>
                <p className="text-xs text-muted-foreground">Corn borers detected. Immediate action recommended.</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex flex-col">
                <p className="font-semibold">Weather Warning</p>
                <p className="text-xs text-muted-foreground">Heavy rainfall expected in the next 24 hours.</p>
              </div>
            </DropdownMenuItem>
             <DropdownMenuItem>
              <div className="flex flex-col">
                <p className="font-semibold">Drone Scan Complete</p>
                <p className="text-xs text-muted-foreground">Analysis for Field B is ready for review.</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  <User />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/account" className="flex items-center">
                    <Settings className="mr-2" /> My Profile
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <ThemeToggler />
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <ContactAdminDialog />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
