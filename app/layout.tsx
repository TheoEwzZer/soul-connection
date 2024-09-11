"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { NextFont } from "next/dist/compiled/@next/font";
import { ReactElement } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from "@/context/user-context";
import { Navbar } from "@/components/navbar";
import { usePathname } from "next/navigation";
import SupabaseProvider from "@/providers/supabase-provider";

const inter: NextFont = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): ReactElement {
  const pathname: string = usePathname();
  const isLoginPage: boolean = pathname === "/login";

  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider>
          <UserProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {!isLoginPage && <Navbar />}
              {children}
            </ThemeProvider>
          </UserProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
