'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CHECKINS_COLLECTION_ID, DATABASE_ID, databases, MEMBERS_COLLECTION_ID, ORGANIZATIONS_COLLECTION_ID, MEMBERSHIP_PLANS_COLLECTION_ID, Query } from '@/lib/appwrite';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { Loader2, CalendarDays, QrCode, CreditCard } from 'lucide-react';
import { Organization, CheckIn } from '@/types';
import { useAuth } from '@/lib/auth-context';     
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CheckInHistory from '@/components/member/CheckInHistory';

interface MemberDetails {
  $id: string;
  name: string;
  email: string;
  createdAt: string;
  planId?: string;
  customFields?: string;
  status: 'active' | 'inactive';
}

interface MembershipPlan {
  $id: string;
  name: string;
  description: string;
  price: number;
  interval: 'monthly' | 'yearly' | 'one-time';
  features: string[];
}

export default function MemberPortalPage() {
  const { organizationId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [membershipPlan, setMembershipPlan] = useState<MembershipPlan | null>(null);
  const [loading, setLoading] = useState(true);


  const fetchData = useCallback(async () => {
  try {
    setLoading(true);

    // Fetch organization details
    const org = await databases.getDocument(
      DATABASE_ID!,
      ORGANIZATIONS_COLLECTION_ID!,
      organizationId as string
    );
    setOrganization(org as unknown as Organization);

    // Fetch member details
    const memberResponse = await databases.listDocuments(
      DATABASE_ID!,
      MEMBERS_COLLECTION_ID!,
      [
        Query.equal("organizationId", organizationId as string),
        Query.equal("email", user?.email || ""),
      ]
    );

    if (memberResponse.documents.length > 0) {
      const memberData = memberResponse.documents[0];
      setMemberDetails(memberData as unknown as MemberDetails);

      // Fetch membership plan if available
      if (memberData.planId) {
        try {
          const planResponse = await databases.getDocument(
            DATABASE_ID!,
            MEMBERSHIP_PLANS_COLLECTION_ID!,
            memberData.planId
          );
          setMembershipPlan(planResponse as unknown as MembershipPlan);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch plan";
          console.error("Error fetching plan:", errorMessage);
        }
      }

      // Fetch recent check-ins
      const checkInsResponse = await databases.listDocuments(
        DATABASE_ID!,
        CHECKINS_COLLECTION_ID!,
        [
          Query.equal("organizationId", organizationId as string),
          Query.equal("memberId", memberResponse.documents[0].$id),
          Query.orderDesc("timestamp"),
          Query.limit(5),
        ]
      );

      setRecentCheckIns(checkInsResponse.documents as unknown as CheckIn[]);
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load member data";
    console.error("Error fetching member data:", errorMessage);
    toast.error("Failed to load member data");
  } finally {
    setLoading(false);
  }
}, [organizationId, user]);
  
  useEffect(() => {
    if (user && organizationId) {
      fetchData();
    }
  }, [organizationId, user, fetchData]);

  

  const handleCheckIn = async () => {
    try {
      // Implementation for self check-in
      toast.success('Check-in successful!');
      // Refresh data after check-in
      fetchData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check in';
      console.error("Check-in error:", errorMessage);
      toast.error('Failed to check in');
    }
  };

  if (loading) {
    return (
      <div className="container px-4 mx-auto py-6 sm:py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!organization || !memberDetails) {
    return (
      <div className="container px-4 mx-auto py-6 sm:py-8 max-w-6xl">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold mb-2">Membership not found</h1>
          <p className="text-muted-foreground">You don&apos;t have an active membership with this organization.</p>
        </div>
      </div>
    );
  }

  // Parse custom fields if they exist
  const customFields = memberDetails.customFields ? 
    JSON.parse(memberDetails.customFields) : {};

  return (
    <div className="container px-4 mx-auto py-6 sm:py-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{organization?.name || 'Member Portal'}</h1>
          <p className="text-muted-foreground mt-1">Welcome, {memberDetails?.name || user?.name}</p>
        </div>
        {memberDetails?.status === 'active' && (
          <Button
            onClick={() => router.push(`/check-in/${organizationId}`)}
            className="w-full sm:w-auto"
          >
            Check In Now
          </Button>
        )}
      </div>
      
      {memberDetails?.status === 'inactive' && (
        <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-800 dark:text-amber-400 text-lg">Membership Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Your membership is currently inactive. Please contact the organization or update your membership plan.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push(`/member-portal/${organizationId}/plans`)}>
              View Membership Plans
            </Button>
          </CardContent>
        </Card>
      )}
    
      <Tabs defaultValue="activity" className="mt-6">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:flex-row gap-2">
          <TabsTrigger value="activity" className="flex-1 sm:flex-auto">Activity</TabsTrigger>
          <TabsTrigger value="qr-code" className="flex-1 sm:flex-auto">QR Code</TabsTrigger>
        </TabsList>
        
        <div className="mt-6 grid gap-6">
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Check-ins</CardTitle>
                <CardDescription>Your most recent attendance records</CardDescription>
              </CardHeader>
              <CardContent>
                {recentCheckIns.length === 0 ? (
                  <p className="text-muted-foreground">No check-ins recorded yet.</p>
                ) : (
                  <div className="space-y-4">
                    {recentCheckIns.map((checkIn) => (
                      <div key={checkIn.$id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-3">
                        <div className="flex items-center">
                          <CalendarDays className="h-5 w-5 mr-3 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="font-medium">{formatDate(checkIn.timestamp)}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(checkIn.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-green-600 text-sm font-medium mt-2 sm:mt-0">Successful</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="qr-code">
            <Card>
              <CardHeader>
                <CardTitle>Quick Check-in</CardTitle>
                <CardDescription>Scan this QR code at the organization&apos;s location</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  <QrCode className="h-48 w-48" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
      
      {memberDetails && (
        <div className="mt-8">
          <CheckInHistory 
            organizationId={organizationId as string} 
            memberId={memberDetails.$id} 
          />
        </div>
      )}
    </div>
  );
}

function formatPrice(price: number, interval: string) {
  if (interval === 'one-time') {
    return `$${price.toFixed(2)}`;
  } else {
    return `$${price.toFixed(2)}/${interval === 'monthly' ? 'mo' : 'yr'}`;
  }
} 