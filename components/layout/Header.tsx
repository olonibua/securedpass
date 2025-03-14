'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Header = () => {
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;
  const [isOpen, setIsOpen] = useState(false);
  
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
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/member-portal">
                <Button variant="ghost">Member Portal</Button>
              </Link>
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
                  <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                  </Link>
                  <Link href="/member-portal" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">Member Portal</Button>
                  </Link>
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
