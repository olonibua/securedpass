'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { databases, Query, DATABASE_ID, ORGANIZATIONS_COLLECTION_ID } from '@/lib/appwrite';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

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
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-sm sm:text-base max-w-xs sm:max-w-md mx-auto">
        Redirecting to your organization dashboard...
      </p>
    </div>
  );
}
