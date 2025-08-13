"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  databases,
  DATABASE_ID,
  ORGANIZATIONS_COLLECTION_ID,
  MEMBERS_COLLECTION_ID,
  ORGANIZATIONS_MEMBERS_COLLECTION_ID,
} from "@/lib/appwrite";
import { Query } from "appwrite";
import { motion } from "framer-motion";

// Add prop interface
interface HeaderProps {
  scrollState?: boolean;
}

const Header = ({ scrollState = false }: HeaderProps) => {
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "member" | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine user role - admin or member
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Check if user is an organization owner/admin
        const orgResponse = await databases.listDocuments(
          DATABASE_ID!,
          ORGANIZATIONS_COLLECTION_ID!,
          [Query.equal("ownerId", user.$id)]
        );

        if (orgResponse.documents.length > 0) {
          // User is an admin
          setUserRole("admin");
        } else {
          // Check if user is a member
          const memberResponse = await databases.listDocuments(
            DATABASE_ID!,
            ORGANIZATIONS_MEMBERS_COLLECTION_ID!,
            [Query.equal("userId", user.$id)]
          );

          // If not found in organizations_members, try the members collection
          if (memberResponse.documents.length === 0) {
            const altMemberResponse = await databases.listDocuments(
              DATABASE_ID!,
              MEMBERS_COLLECTION_ID!,
              [Query.equal("email", user.email)]
            );

            setUserRole(
              altMemberResponse.documents.length > 0 ? "member" : null
            );
          } else {
            setUserRole("member");
          }
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to check user role";
        console.error("Error checking user role:", errorMessage);
        // Default to null if we can't determine
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      checkUserRole();
    } else {
      setUserRole(null);
      setLoading(false);
    }
  }, [user]);

  // Render appropriate dashboard link based on user role
  const renderDashboardLink = () => {
    if (loading) {
      return <Skeleton className="h-10 w-24" />;
    }

    if (userRole === "admin") {
      return (
        <Link href="/dashboard">
          <Button variant="ghost" className="text-[var(--stedi-dark-gray)] hover:text-[var(--stedi-primary)] dark:text-[var(--stedi-light-gray)]">Dashboard</Button>
        </Link>
      );
    }

    if (userRole === "member") {
      return (
        <Link href="/member-portal">
          <Button variant="ghost" className="text-[var(--stedi-dark-gray)] hover:text-[var(--stedi-primary)] dark:text-[var(--stedi-light-gray)]">Member Portal</Button>
        </Link>
      );
    }

    return null;
  };

  // Render appropriate mobile dashboard link
  const renderMobileDashboardLink = () => {
    if (loading) {
      return <Skeleton className="h-10 w-full" />;
    }

    if (userRole === "admin") {
      return (
        <Link href="/dashboard" onClick={() => setIsOpen(false)}>
          <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 ">
            Dashboard
          </Button>
        </Link>
      );
    }

    if (userRole === "member") {
      return (
        <Link href="/member-portal" onClick={() => setIsOpen(false)}>
          <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 ">
            Member Portal
          </Button>
        </Link>
      );
    }

    return null;
  };

  return (
    <motion.header 
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrollState ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto flex justify-between items-center py-4 px-4">
        <Link href="/" className="flex items-center gap-2 z-10">
          <span className={`text-xl font-bold transition-all duration-300 ${
            scrollState ? 'text-black' : 'text-white'
          }`}>SecuredPass</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {renderDashboardLink()}
              <Button 
                variant="outline" 
                onClick={logout}
                className="border-[var(--stedi-primary)] text-[var(--stedi-primary)] hover:bg-[var(--stedi-primary-light)]"
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={`font-bold transition-all duration-300 ${
                     scrollState ? 'text-black' : 'text-white'}`}>
                      Log in
                      <ChevronDown className={`h-4 w-4 ${scrollState ? 'text-black' : ''}`} />
                  </Button>
                  {/* <Button 
                    variant="ghost" 
                    className={`flex items-center gap-1 transition-all duration-300 ${
                      scrollState ? 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400' : 'text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    Log in
                    <ChevronDown className="h-4 w-4" />
                  </Button> */}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border border-blue-100 dark:border-blue-800 bg-white dark:bg-gray-900">
                  <DropdownMenuItem asChild>
                    <Link href="/login" className="w-full cursor-pointer ">
                      Organization Login
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/member-login"
                      className="w-full cursor-pointer "
                    >
                      Member Login
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="flex items-center gap-1 bg-[#1e293b] text-white hover:bg-[#1e293b] hover:-translate-y-px transition-all duration-200">
                    Register
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border border-blue-100 dark:border-blue-800 bg-white dark:bg-gray-900">
                  <DropdownMenuItem asChild>
                    <Link href="/register" className="w-full cursor-pointer ">
                      Organization Registration
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className={`transition-all duration-300 ${
              scrollState ? 'text-gray-700 dark:text-gray-300' : 'text-gray-800 dark:text-gray-200'
            }`}>
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[320px] border-l border-blue-100 dark:border-blue-800 bg-gray-50 dark:bg-gray-900 p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-blue-100 dark:border-blue-800 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">SecuredPass</span>
                </Link>
                {/* <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-gray-700 dark:text-gray-300">
                  <X className="h-5 w-5" />
                </Button> */}
              </div>
              
              <div className="flex flex-col gap-1 p-4 flex-1">
                {isAuthenticated ? (
                  <>
                    {renderMobileDashboardLink()}
                    <Button
                      variant="outline"
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      className="w-full justify-start mt-2 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="py-2">
                      <h3 className="font-medium mb-2 text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">Log in</h3>
                      <div className="space-y-1">
                        <Link href="/login" onClick={() => setIsOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 ">
                            Organization Login
                          </Button>
                        </Link>
                        <Link href="/member-login" onClick={() => setIsOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 ">
                            Member Login
                          </Button>
                        </Link>
                      </div>
                    </div>

                    <div className="py-2 border-t border-gray-100 dark:border-gray-800 mt-2">
                      <h3 className="font-medium mb-2 text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Register</h3>
                      <Link href="/register" onClick={() => setIsOpen(false)}>
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500">
                          Organization Registration
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-auto p-4 border-t border-blue-100 dark:border-blue-800 text-xs text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} SecuredPass. All rights reserved.
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </motion.header>
  );
};

export default Header;
