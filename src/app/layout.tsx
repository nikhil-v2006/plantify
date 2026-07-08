import type { Metadata } from "next";
import { Inter, PT_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { FirebaseClientProvider } from "@/firebase";

const ptSans = PT_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-sans",
});

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-headline',
});

export const metadata: Metadata = {
  title: "Field Master",
  description: "AI-Powered Crop and Soil Health Monitoring",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          ptSans.variable,
          inter.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseClientProvider>{children}</FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
