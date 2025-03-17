'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CHECKINS_COLLECTION_ID, DATABASE_ID, databases, MEMBERS_COLLECTION_ID, ORGANIZATIONS_COLLECTION_ID, MEMBERSHIP_PLANS_COLLECTION_ID, MEMBERSHIP_PURCHASES_COLLECTION_ID, Query } from '@/lib/appwrite';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { CalendarDays, QrCode, Check, UserCircle, CreditCard } from 'lucide-react';
import { Organization, CheckIn } from '@/types';
import { useAuth } from '@/lib/auth-context';     
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CheckInHistory from '@/components/member/CheckInHistory';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface MemberDetails {
  $id: string;
  name: string;
  email: string;
  createdAt: string;
  planId?: string;
  customFields?: string;
  status: 'active' | 'inactive';
  lastCheckIn?: string;
}

interface MembershipPlan {
  $id: string;
  name: string;
  description: string;
  price: number;
  interval: 'monthly' | 'yearly' | 'one-time';
  features: string[];
}

interface MembershipPurchase {
  $id: string;
  organizationId: string;
  planId: string;
  userId: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  paymentDate: string;
  transactionReference: string;
  paymentModelUsed: 'subscription' | 'transaction_fee';
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
  const [recentPurchases, setRecentPurchases] = useState<MembershipPurchase[]>([]);
  const [hasActiveMembership, setHasActiveMembership] = useState(false);
  
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

      // Fetch recent purchases
      const purchasesResponse = await databases.listDocuments(
        DATABASE_ID!,
        MEMBERSHIP_PURCHASES_COLLECTION_ID!,
        [
          Query.equal("userId", user?.$id || ""),
          Query.equal("organizationId", organizationId as string),
          Query.orderDesc("paymentDate"),
          Query.limit(5),
        ]
      );
      
      const purchases = purchasesResponse.documents as unknown as MembershipPurchase[];
      setRecentPurchases(purchases);
      
      // Set active membership status based on completed purchases
      // In a real app, you'd check if the subscription is still valid based on plan intervals
      setHasActiveMembership(purchases.some(p => p.status === 'completed'));
      
      // Update member status if needed
      if (hasActiveMembership && memberData.status !== 'active') {
        // Optional: Update member status to active in database
      }
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

  

  

  if (loading) {
    return (
      <div className="container px-4 mx-auto py-6 sm:py-8 max-w-6xl">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        
        {/* Membership status skeleton */}
        <Skeleton className="w-full h-24 mb-6" />
        
        {/* Membership plan skeleton */}
        <Skeleton className="w-full h-48 mb-6" />
        
        {/* Member details skeleton */}
        <Skeleton className="w-full h-64 mb-6" />
        
        {/* Recent payments skeleton */}
        <Skeleton className="w-full h-48 mb-6" />
        
        {/* Activity tabs skeleton */}
        <div className="mt-6">
          <Skeleton className="w-full h-8 mb-4" />
          <Skeleton className="w-full h-64" />
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

 

  return (
    <div className="container px-4 mx-auto py-6 sm:py-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{organization?.name || 'Member Portal'}</h1>
          <p className="text-muted-foreground mt-1">Welcome, {memberDetails?.name || user?.name}</p>
        </div>
      
      </div>
      
      {memberDetails && (
        <Card className={`mb-6 ${hasActiveMembership ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`${hasActiveMembership ? 'text-green-800 dark:text-green-400' : 'text-amber-800 dark:text-amber-400'} text-lg`}>
              {hasActiveMembership ? 'Active Membership' : 'Membership Inactive'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{hasActiveMembership 
              ? 'Your membership is active. Enjoy full access to all features and benefits.' 
              : 'Your membership is currently inactive. Please contact the organization or update your membership plan.'}
            </p>
            {!hasActiveMembership && (
              <Button variant="outline" className="mt-4" onClick={() => router.push(`/member-portal/${organizationId}/plans`)}>
                View Membership Plans
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    
      {memberDetails && membershipPlan && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Membership Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h3 className="font-medium text-lg">{membershipPlan.name}</h3>
                <p className="text-muted-foreground">{membershipPlan.description}</p>
              </div>
              <Badge className="mt-2 sm:mt-0" variant={memberDetails.status === 'active' ? 'default' : 'destructive'}>
                {memberDetails.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            {membershipPlan.features && membershipPlan.features.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Plan Features:</h4>
                <ul className="space-y-1">
                  {membershipPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    
      {memberDetails && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <UserCircle className="mr-2 h-5 w-5" />
              Member Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Member ID</h3>
                <p>{memberDetails.$id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                <p>{memberDetails.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <p className={memberDetails.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                  {memberDetails.status === 'active' ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Joined</h3>
                <p>{formatDate(memberDetails.createdAt)}</p>
              </div>
              {memberDetails.lastCheckIn && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Last Check-in</h3>
                  <p>{formatDate(memberDetails.lastCheckIn)}</p>
                </div>
              )}
            </div>

            {memberDetails.customFields && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">Additional Information</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(JSON.parse(memberDetails.customFields)).map(([key, value]) => (
                    <div key={key}>
                      <h4 className="text-sm font-medium text-muted-foreground">{key}</h4>
                      <p>{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    
      {recentPurchases.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPurchases.map((purchase) => (
                <div key={purchase.$id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <p className="font-medium">Payment - {formatDate(purchase.paymentDate)}</p>
                    <p className="text-sm text-muted-foreground">Ref: {purchase.transactionReference}</p>
                  </div>
                  <div className="flex items-center">
                    <Badge variant={purchase.status === 'completed' ? 'default' : 'outline'}>
                      {purchase.status}
                    </Badge>
                    <span className="ml-3 font-semibold">₦{purchase.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
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

