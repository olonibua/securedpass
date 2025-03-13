'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Organization } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ChevronDown, LogOut, Settings, Home } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface DashboardHeaderProps {
  organization: Organization;
}

export default function DashboardHeader({ organization }: DashboardHeaderProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut({ redirect: false });
      router.push('/');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      console.error("Error signing out:", errorMessage);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        {organization.logo ? (
          <Image 
            src={organization.logo} 
            alt={organization.name} 
            width={48} 
            height={48} 
            className="rounded-md"
          />
        ) : (
          <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center text-primary font-bold text-xl">
            {organization.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{organization.name}</h1>
          <p className="text-sm text-muted-foreground">
            Plan: <span className="capitalize">{organization.plan}</span>
            {organization.planExpiryDate && (
              <> · Expires: {new Date(organization.planExpiryDate).toLocaleDateString()}</>
            )}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </Link>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Organization</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push(`/dashboard/${organization.$id}/settings`)}>
              Organization Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/dashboard/${organization.$id}/team`)}>
              Team Management
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
              <LogOut className="h-4 w-4 mr-2" />
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 