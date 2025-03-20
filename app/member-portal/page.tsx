'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { databases, DATABASE_ID, ORGANIZATIONS_MEMBERS_COLLECTION_ID, MEMBERS_COLLECTION_ID, Query } from '@/lib/appwrite';

export default function MemberPortalRedirect() {
  const router = useRouter();
  const { user, isLoaded: authLoaded } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const redirectToOrganization = async () => {
      try {
        // Don't proceed if auth isn't loaded or there's no user
        if (!authLoaded) return;
        if (!user) {
          router.push("/member-login");
          return;
        }


        // Find the user's organizations
        let orgId = null;

        // Check organizations_members first
        const orgMembersResponse = await databases.listDocuments(
          DATABASE_ID,
          ORGANIZATIONS_MEMBERS_COLLECTION_ID,
          [Query.equal("userId", user.$id)]
        );

        if (orgMembersResponse.documents.length > 0) {
          orgId = orgMembersResponse.documents[0].organizationId;
        } else {
          // Try members collection
          const membersResponse = await databases.listDocuments(
            DATABASE_ID,
            MEMBERS_COLLECTION_ID,
            [Query.equal("email", user.email)]
          );

          if (membersResponse.documents.length > 0) {
            orgId = membersResponse.documents[0].organizationId;
          }
        }

        if (orgId) {
          router.push(`/member-portal/${orgId}`);
        } else {
          // No organizations found - redirect to member-login with message
          router.push("/member-login?message=no-organizations");
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load user data";
        console.error("Error loading user data:", errorMessage);
        router.push("/member-login");
      } finally {
        setIsLoading(false);
      }
    };

    redirectToOrganization();
  }, [user, authLoaded, router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <span className="ml-3 text-primary">Finding your membership...</span>
    </div>
  );
}