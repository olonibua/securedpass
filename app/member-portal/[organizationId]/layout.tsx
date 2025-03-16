'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
export default function MemberPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as string;
  const [initialAuthCheckDone, setInitialAuthCheckDone] = useState(false);

  // One-time auth check
  useEffect(() => {
    if (!authLoading) {
      setInitialAuthCheckDone(true);
      if (!user) {
        router.push(`/member-login?redirect=/member-portal/${organizationId}`);
      }
    }
  }, [authLoading, user, router, organizationId]);

  if (!initialAuthCheckDone || (authLoading && !user)) {
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