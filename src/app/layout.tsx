import type { Metadata } from "next";
import localFont from "next/font/local";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { Building, LayoutDashboard } from "lucide-react";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ComplianceApp",
  description: "Fleet DOT Compliance Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <header className="border-b">
            <div className="flex justify-between items-center p-4">
              <div className="flex items-center gap-6">
                <Link href="/" className="text-xl font-semibold">
                  ComplianceApp
                </Link>
                <SignedIn>
                  <nav className="flex gap-4 text-sm">
                    <Link 
                      href="/dashboard" 
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link 
                      href="/organizations" 
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Building className="h-4 w-4" />
                      Organizations
                    </Link>
                  </nav>
                </SignedIn>
              </div>
              <div className="flex gap-4 items-center">
                <SignedOut>
                  <SignInButton />
                  <SignUpButton />
                </SignedOut>
                <SignedIn>
                  <UserButton />
                </SignedIn>
              </div>
            </div>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
