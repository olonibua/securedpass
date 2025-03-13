import type { Metadata } from "next";

import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth-context';


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Membership Management",
  description: "A platform for managing organization memberships",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
