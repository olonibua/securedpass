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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!organization || !memberDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-2">Membership not found</h1>
        <p className="text-muted-foreground">You don&apos;t have an active membership with this organization.</p>
      </div>
    );
  }

  // Parse custom fields if they exist
  const customFields = memberDetails.customFields ? 
    JSON.parse(memberDetails.customFields) : {};

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{organization.name}</h1>
          <p className="text-muted-foreground">{organization.description as string}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCheckIn}>Quick Check-in</Button>
          <Button 
            variant="outline"
            onClick={() => router.push(`/member-portal/${organizationId}/plans`)}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Membership Plans
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="membership" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="membership">Membership</TabsTrigger>
          <TabsTrigger value="check-ins">Check-ins</TabsTrigger>
          <TabsTrigger value="qr-code">QR Code</TabsTrigger>
        </TabsList>
        
        <TabsContent value="membership" className="space-y-4">
          {/* Member Info */}
          <Card>
            <CardHeader>
              <CardTitle>Your Membership</CardTitle>
              <CardDescription>Your membership details and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p>{memberDetails.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{memberDetails.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                  <p>{formatDate(memberDetails.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Membership Status</p>
                  <p className="text-green-600 font-medium">Active</p>
                </div>
                
                {/* Display custom fields */}
                {Object.entries(customFields).map(([fieldId, value]) => (
                  <div key={fieldId}>
                    <p className="text-sm font-medium text-muted-foreground">{fieldId}</p>
                    <p>{value as string}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your subscription details</CardDescription>
            </CardHeader>
            <CardContent>
              {membershipPlan ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{membershipPlan.name as string}</h3>
                    <p className="text-muted-foreground">
                      {formatPrice(membershipPlan.price as number, membershipPlan.interval as string)}
                    </p>
                  </div>
                  <p>{membershipPlan.description as string}</p>
                  {(membershipPlan.features as string[])?.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Features:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {(membershipPlan.features as string[]).map((feature: string, index: number) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">You don&apos;t have an active subscription plan</p>
                  <Button onClick={() => router.push(`/member-portal/${organizationId}/plans`)}>
                    View Available Plans
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="check-ins">
          {/* Recent Check-ins */}
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
                    <div key={checkIn.$id} className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center">
                        <CalendarDays className="h-5 w-5 mr-3 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{formatDate(checkIn.timestamp)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(checkIn.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-green-600 text-sm font-medium">Successful</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="qr-code">
          {/* QR Code for Check-in */}
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