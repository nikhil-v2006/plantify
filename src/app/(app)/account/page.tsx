
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Camera } from "lucide-react";

const accountFormSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().optional(),
  age: z.coerce.number().min(18, "You must be at least 18.").optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
});

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}


export default function AccountPage() {
  const { toast } = useToast();
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      fullName: "Srichaitanya Karri",
      email: "karrisrichaitanya@gmail.com",
      phone: "+91 9177196025",
      age: 21,
      gender: "male",
    },
  });
  
  const watchedFullName = form.watch("fullName");

  function onSubmit(values: z.infer<typeof accountFormSchema>) {
    console.log(values);
    console.log("Profile Picture:", profilePic ? "Set" : "Not Set");
    toast({
      title: "Profile Updated",
      description: "Your details have been saved successfully.",
    });
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePic(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Manage your personal information and account settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="relative">
                   <Avatar className="h-24 w-24 text-4xl">
                        <AvatarImage src={profilePic ?? undefined} alt="Profile Picture" />
                        <AvatarFallback>
                          {watchedFullName ? getInitials(watchedFullName) : <User className="h-12 w-12" />}
                        </AvatarFallback>
                    </Avatar>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      className="hidden"
                      accept="image/png, image/jpeg, image/gif"
                    />
                    <Button type="button" size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8" onClick={() => fileInputRef.current?.click()}>
                        <Camera className="h-4 w-4" />
                        <span className="sr-only">Change profile picture</span>
                    </Button>
                </div>
                <div className="grid gap-1">
                    <h2 className="text-2xl font-bold">{form.getValues("fullName")}</h2>
                    <p className="text-muted-foreground">{form.getValues("email")}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Your age" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a gender" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
              </div>

              <Button type="submit">Save Changes</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
