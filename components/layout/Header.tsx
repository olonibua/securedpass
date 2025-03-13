'use client';

import Link from 'next/link';
import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;
  
  return (
    <header className="border-b">
      <div className="container mx-auto flex justify-between items-center py-4">
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
        
        <div className="flex items-center gap-4">
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
      </div>
    </header>
  );
}

export default Header
