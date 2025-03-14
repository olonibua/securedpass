'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Settings, 
  LogOut,
  Menu,
  X,
  CreditCard,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { databases, Query, DATABASE_ID, ORGANIZATIONS_MEMBERS_COLLECTION_ID, MEMBERS_COLLECTION_ID } from '@/lib/appwrite';
import { toast } from 'sonner';


interface MemberSidebarProps {
  organizationId?: string;
  onSignOut: () => void;
}

export default function MemberSidebar({ organizationId, onSignOut }: MemberSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded: authLoaded } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userOrganizations, setUserOrganizations] = useState<{ id: string, name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Use useCallback to prevent recreation of this function on every render
  const fetchUserOrganizations = useCallback(async () => {
    try {
      if (!user?.$id || !authLoaded) return;
      
      setLoading(true);
      
      // Check organizations_members first
      const orgMembersResponse = await databases.listDocuments(
        DATABASE_ID,
        ORGANIZATIONS_MEMBERS_COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );
      
      let orgs: { id: string, name: string }[] = [];
      
      // If found in organizations_members
      if (orgMembersResponse.documents.length > 0) {
        // Get organization details for each membership
        const orgPromises = orgMembersResponse.documents.map(async (doc) => {
          const orgResponse = await databases.getDocument(
            DATABASE_ID,
            'organizations',
            doc.organizationId
          );
          return { id: orgResponse.$id, name: orgResponse.name };
        });
        
        orgs = await Promise.all(orgPromises);
      } else {
        // Try members collection
        const membersResponse = await databases.listDocuments(
          DATABASE_ID,
          MEMBERS_COLLECTION_ID,
          [Query.equal('email', user.email)]
        );
        
        if (membersResponse.documents.length > 0) {
          const orgPromises = membersResponse.documents.map(async (doc) => {
            const orgResponse = await databases.getDocument(
              DATABASE_ID,
              'organizations',
              doc.organizationId
            );
            return { id: orgResponse.$id, name: orgResponse.name };
          });
          
          orgs = await Promise.all(orgPromises);
        }
      }
      
      setUserOrganizations(orgs);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch organizations';
      console.error("Error fetching organizations:", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, authLoaded]);
  
  useEffect(() => {
    if (authLoaded) {
      fetchUserOrganizations();
    }
  }, [fetchUserOrganizations, authLoaded]);
  
  // Choose the first organization as default if organizationId isn't provided
  useEffect(() => {
    if (!organizationId && userOrganizations.length > 0 && !loading && authLoaded) {
      router.push(`/member-portal/${userOrganizations[0].id}`);
    }
  }, [organizationId, userOrganizations, router, loading, authLoaded]);
  
 ;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

 
  
  const sidebarContent = (
    <>
      <div className="p-6">
        <h2 className="text-xl font-bold">Member Portal</h2>
      </div>

      <div className="flex-1 px-4 space-y-2">
        {!authLoaded || loading ? (
          // Show loading UI while loading
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : (
          // Show actual navigation when loaded
          <>
            
            {/* Always show dashboard link for current organization */}
            {organizationId && (
              <Link 
                href={`/member-portal/${organizationId}`}
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  pathname === `/member-portal/${organizationId}` ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                <Home className="mr-2 h-4 w-4" />
                Main Dashboard
              </Link>
            )}

            {/* Subscription link */}
            {organizationId && (
              <Link 
                href={`/member-portal/${organizationId}/subscription`}
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  pathname?.includes('/subscription') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Subscription
              </Link>
            )}
            
            {/* Membership Plans link */}
            {organizationId && (
              <Link 
                href={`/member-portal/${organizationId}/plans`}
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  pathname?.includes('/plans') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Membership Plans
              </Link>
            )}
            
            {/* User settings */}
            {organizationId && (
              <Link 
                href={`/member-portal/${organizationId}/settings`}
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  pathname?.includes('/settings') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            )}
          </>
        )}
      </div>

      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full justify-start hover:bg-destructive/10 hover:text-destructive transition-colors"
          onClick={onSignOut}
          disabled={loading || !authLoaded}
        >
          {!authLoaded || loading ? (
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