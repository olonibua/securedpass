'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { databases, DATABASE_ID, ORGANIZATIONS_COLLECTION_ID, MEMBERS_COLLECTION_ID, ORGANIZATIONS_MEMBERS_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

const Header = () => {
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'member' | null>(null);
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
          [Query.equal('ownerId', user.$id)]
        );
        
        if (orgResponse.documents.length > 0) {
          // User is an admin
          setUserRole('admin');
        } else {
          // Check if user is a member
          const memberResponse = await databases.listDocuments(
            DATABASE_ID!,
            ORGANIZATIONS_MEMBERS_COLLECTION_ID!,
            [Query.equal('userId', user.$id)]
          );
          
          // If not found in organizations_members, try the members collection
          if (memberResponse.documents.length === 0) {
            const altMemberResponse = await databases.listDocuments(
              DATABASE_ID!,
              MEMBERS_COLLECTION_ID!,
              [Query.equal('email', user.email)]
            );
            
            setUserRole(altMemberResponse.documents.length > 0 ? 'member' : null);
          } else {
            setUserRole('member');
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to check user role';
        console.error('Error checking user role:', errorMessage);
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
    
    if (userRole === 'admin') {
      return (
        <Link href="/dashboard">
          <Button variant="ghost">Dashboard</Button>
        </Link>
      );
    }
    
    if (userRole === 'member') {
      return (
        <Link href="/member-portal">
          <Button variant="ghost">Member Portal</Button>
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
    
    if (userRole === 'admin') {
      return (
        <Link href="/dashboard" onClick={() => setIsOpen(false)}>
          <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
        </Link>
      );
    }
    
    if (userRole === 'member') {
      return (
        <Link href="/member-portal" onClick={() => setIsOpen(false)}>
          <Button variant="ghost" className="w-full justify-start">Member Portal</Button>
        </Link>
      );
    }
    
    return null;
  };
  
  return (
    <header className="border-b">
      <div className="container mx-auto flex justify-between items-center py-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/entryflex.webp"
            alt="SecuredPass Logo"
            width={40}
            height={40}
            className="dark:invert"
          />
          <span className="text-xl font-bold">SecuredPass</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {renderDashboardLink()}
              <Button variant="outline" onClick={logout}>Sign out</Button>
            </>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1">
                    Log in
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/login" className="w-full cursor-pointer">
                      Organization Login
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/member-login" className="w-full cursor-pointer">
                      Member Login
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="flex items-center gap-1">
                    Register
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/register" className="w-full cursor-pointer">
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
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[250px] sm:w-[300px]">
            <div className="flex flex-col gap-4 mt-8">
              {isAuthenticated ? (
                <>
                  {renderMobileDashboardLink()}
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="w-full justify-start"
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <p className="font-medium mb-2">Log in</p>
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">Organization Login</Button>
                  </Link>
                  <Link href="/member-login" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">Member Login</Button>
                  </Link>
                  
                  <p className="font-medium mt-4 mb-2">Register</p>
                  <Link href="/register" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">Organization Registration</Button>
                  </Link>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
