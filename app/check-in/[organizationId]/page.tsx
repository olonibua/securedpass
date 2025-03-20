'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DATABASE_ID, databases, ORGANIZATIONS_COLLECTION_ID } from '@/lib/appwrite';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import CompanyCheckIn from '@/components/check-in/CompanyCheckIn';
import MembershipCheckIn from '@/components/check-in/MembershipCheckIn';
import { Models } from 'appwrite';

export default function CheckInPage() {
  const params = useParams();
  const organizationId = params.organizationId as string;
  const { user: _user, isLoaded: authLoaded } = useAuth();
  
  const [organization, setOrganization] = useState<Models.Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setLoading(true);
        
        // Fetch organization data
        const org = await databases.getDocument(
          DATABASE_ID,
          ORGANIZATIONS_COLLECTION_ID,
          organizationId
        );
        
        setOrganization(org );
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
        console.error("Error fetching organization:", errorMessage);
        toast.error('Failed to load organization data');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Organization Not Found</CardTitle>
            <CardDescription className="text-center">
              The organization you&apos;re looking for doesn&apos;t exist or is no longer active.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Determine which component to render based on organization type
  const isCompany = organization.organizationType === 'company' || organization.type === 'company';
  
  return isCompany ? (
    <CompanyCheckIn organization={organization} />
  ) : (
    <MembershipCheckIn 
      organization={organization}
      user={_user as unknown as Models.Document}
      authLoaded={authLoaded}
    />
  );
}