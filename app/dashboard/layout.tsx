'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Settings,
  Menu,
  X,
  LogOut,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as string;
  
  // Check authentication on component mount
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  // Close sidebar when path changes (mobile navigation)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Improved isActive function that correctly handles organization-specific routes
  const isActive = useCallback((path: string) => {
    // For the main dashboard, be more specific to avoid highlighting for all dashboard routes
    if (path === '/dashboard') {
      return pathname === `/dashboard/${organizationId}` || pathname === '/dashboard';
    }
    
    // For other sections, check if the current path contains the section
    const sectionPath = path.replace('/dashboard', '');
    return pathname.includes(sectionPath);
  }, [pathname, organizationId]);

  // Get the base path for organization-specific routes
  const getOrgPath = useCallback((path: string) => {
    if (!organizationId) return path;
    if (path === '/dashboard') return `/dashboard/${organizationId}`;
    return `/dashboard/${organizationId}${path.replace('/dashboard', '')}`;
  }, [organizationId]);

  const handleSignOut = async () => {
    try {
      // Use the centralized logout function from auth context
      // which will redirect to home page
      await logout();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar toggle */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <Link
              href={getOrgPath("/")}
              className="flex items-center gap-2"
            >
              <span className="text-xl font-bold">SecuredPass</span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <Link href={getOrgPath("/dashboard")}>
              <Button
                variant={isActive("/dashboard") ? "default" : "ghost"}
                className="w-full justify-start"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>

            <Link href={getOrgPath("/dashboard/members")}>
              <Button
                variant={isActive("/dashboard/members") ? "default" : "ghost"}
                className="w-full justify-start"
              >
                <Users className="mr-2 h-4 w-4" />
                Members
              </Button>
            </Link>

            <Link href={getOrgPath("/dashboard/check-ins")}>
              <Button
                variant={isActive("/dashboard/check-ins") ? "default" : "ghost"}
                className="w-full justify-start"
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Check-ins
              </Button>
            </Link>
            <Link href={getOrgPath("/dashboard/administrators")}>
              <Button
                variant={isActive("/dashboard/administrators") ? "default" : "ghost"}
                className="w-full justify-start"
              >
                <Users className="mr-2 h-4 w-4" />
                Administrators
              </Button>
            </Link>
            <Link href={getOrgPath("/dashboard/payment")}>
              <Button
                variant={isActive("/dashboard/payment") ? "default" : "ghost"}
                className="w-full justify-start"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Payment
              </Button>
            </Link>

            <Link href={getOrgPath("/dashboard/settings")}>
              <Button
                variant={isActive("/dashboard/settings") ? "default" : "ghost"}
                className="w-full justify-start"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
          </nav>

          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-64 overflow-y-auto">
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
