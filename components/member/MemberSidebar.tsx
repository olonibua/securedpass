'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  CalendarDays, 
  Settings, 
  LogOut,
  Menu,
  X,
  Calendar,
  CreditCard as PaymentIcon,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { databases, Query, DATABASE_ID, ORGANIZATIONS_MEMBERS_COLLECTION_ID } from '@/lib/appwrite';
import { toast } from 'sonner';


interface MemberSidebarProps {
  organizationId?: string;
  onSignOut: () => void;
}

export default function MemberSidebar({ organizationId, onSignOut }: MemberSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userOrganizations, setUserOrganizations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserOrganizations = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        ORGANIZATIONS_MEMBERS_COLLECTION_ID,
        [Query.equal("userId", user?.$id || "")]
      );

      const orgIds = response.documents.map((doc) => doc.organizationId);
      setUserOrganizations(orgIds);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch user organizations";
      console.error("Error fetching user organizations:", errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchUserOrganizations();
    }
  }, [user, fetchUserOrganizations]);

  
  
  const isActive = (path: string) => {
    return pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (path: string) => {
    // If we have an organizationId, use it
    if (organizationId) {
      router.push(path.replace(':organizationId', organizationId));
      return;
    }
    
    // If user has only one organization, use that
    if (userOrganizations.length === 1) {
      router.push(path.replace(':organizationId', userOrganizations[0]));
      return;
    }
    
    // If no organizationId and user has multiple orgs, go to dashboard to select one
    if (userOrganizations.length > 1) {
      toast.info('Please select an organization first');
      router.push('/member-portal');
      return;
    }
    
    // If no organizations at all
    toast.error('No membership found');
    router.push('/member-portal');
  };
  
  const sidebarContent = (
    <>
      <div className="p-6">
        <h2 className="text-xl font-bold">Member Portal</h2>
      </div>

      <div className="flex-1 px-4 space-y-2">
        {loading ? (
          // Show loading UI while loading
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          </>
        ) : (
          // Show actual navigation when loaded
          <>
            <Link href="/member-portal">
              <Button
                variant={isActive("/member-portal") ? "secondary" : "ghost"}
                className="w-full justify-start transition-colors hover:bg-secondary/80"
              >
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>

            {organizationId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
              >
                <div className="pt-4 pb-2">
                  <h3 className="text-sm font-medium text-muted-foreground px-4">
                    Organization
                  </h3>
                </div>

                <Link href={`/check-in/${organizationId}`}>
                  <Button
                    variant={
                      isActive(`/check-in/${organizationId}`)
                        ? "secondary"
                        : "ghost"
                    }
                    className="w-full justify-start transition-colors hover:bg-secondary/80"
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Check In
                  </Button>
                </Link>
              </motion.div>
            )}

            <Button
              variant={pathname.includes("/subscription") ? "secondary" : "ghost"}
              className="w-full justify-start transition-colors hover:bg-secondary/80"
              onClick={() => handleNavigation('/member-portal/:organizationId/subscription')}
              disabled={loading}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Subscription
            </Button>
            
            <Button
              variant={pathname.includes("/payment") ? "secondary" : "ghost"}
              className="w-full justify-start transition-colors hover:bg-secondary/80"
              onClick={() => handleNavigation('/member-portal/:organizationId/payment')}
              disabled={loading}
            >
              <PaymentIcon className="mr-2 h-4 w-4" />
              Payment
            </Button>

            <Button
              variant={pathname.includes("/settings") ? "secondary" : "ghost"}
              className="w-full justify-start transition-colors hover:bg-secondary/80"
              onClick={() => handleNavigation('/member-portal/:organizationId/settings')}
              disabled={loading}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </>
        )}
      </div>

      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full justify-start hover:bg-destructive/10 hover:text-destructive transition-colors"
          onClick={onSignOut}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </>
          )}
        </Button>
      </div>
    </>
  );
  
  return (
    <>
      {/* Mobile menu button - only visible on small screens */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleMobileMenu}
          className="rounded-full shadow-md"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:flex h-screen border-r flex-col w-64 bg-background shadow-sm">
        {sidebarContent}
      </div>
      
      {/* Mobile sidebar - animated slide-in */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="fixed inset-y-0 left-0 w-64 bg-background border-r shadow-lg"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {sidebarContent}
            </motion.div>
            
            {/* Close when clicking outside */}
            <div 
              className="fixed inset-0 z-[-1]" 
              onClick={() => setIsMobileMenuOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 