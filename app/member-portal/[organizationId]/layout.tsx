'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { databases, DATABASE_ID, ORGANIZATIONS_MEMBERS_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

export default function MemberPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading, checkAuth } = useAuth();
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as string;
  const [initialAuthCheckDone, setInitialAuthCheckDone] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  // First, we'll do a fresh auth check to make sure we have the latest state
  useEffect(() => {
    const refreshAuth = async () => {
      // Force a recheck of authentication
      await checkAuth();
      setInitialAuthCheckDone(true);
    };
    
    refreshAuth();
  }, [checkAuth]);

  // Then check if user has access to this organization
  useEffect(() => {
    const checkAccess = async () => {
      if (!authLoading && initialAuthCheckDone) {
        if (!user) {
          router.push('/member-login');
          return;
        }
        
        try {
          const memberCheck = await databases.listDocuments(
            DATABASE_ID!,
            ORGANIZATIONS_MEMBERS_COLLECTION_ID!,
            [
              Query.equal("userId", user.$id),
              Query.equal("organizationId", organizationId)
            ]
          );
          
          if (memberCheck.documents.length === 0) {
            router.push('/member-login');
            return;
          }
          
          setHasAccess(true);
        } catch (error) {
          console.error("Error checking organization access:", error);
          router.push('/member-login');
        }
      }
    };
    
    if (initialAuthCheckDone && !hasAccess) {
      checkAccess();
    }
  }, [authLoading, user, router, organizationId, initialAuthCheckDone]);

  // Show loading state while checking permissions
  if (!initialAuthCheckDone || authLoading || (!hasAccess && user)) {
    return <MemberPortalSkeleton />;
  }

  return <>{children}</>;
}

function MemberPortalSkeleton() {
  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 space-y-8">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-24" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </div>
      
      <div>
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
} 