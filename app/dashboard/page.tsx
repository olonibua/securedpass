'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { databases, Query, DATABASE_ID, ORGANIZATIONS_COLLECTION_ID } from '@/lib/appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);

  const redirectToOrganization = useCallback(async () => {
    try {
      setLoading(true);

      if (!user?.$id) {
        throw new Error("User not found");
      }

      // Fetch organizations where user is owner
      const ownerOrgsResponse = await databases.listDocuments(
        DATABASE_ID,
        ORGANIZATIONS_COLLECTION_ID,
        [Query.equal("ownerId", user.$id)]
      );

      // If user has an organization as owner, redirect to it
      if (ownerOrgsResponse.documents.length > 0) {
        router.push(`/dashboard/${ownerOrgsResponse.documents[0].$id}`);
        return;
      }

      // User has no organizations, show error
      toast.error("You are not associated with any organization");
      router.push("/");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load dashboard data";
      console.error("Error in dashboard redirect:", errorMessage);
      toast.error("Failed to load dashboard data");
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [user?.$id, router]);

  useEffect(() => {
    if (user && !authLoading) {
      redirectToOrganization();
    }
  }, [user, authLoading, redirectToOrganization]);

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Dashboard header skeleton */}
      <div className="mb-8">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      
      {/* Stats row skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
      
      {/* Main content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mt-8 text-center">
        Redirecting to your organization dashboard...
      </p>
    </div>
  );
}
