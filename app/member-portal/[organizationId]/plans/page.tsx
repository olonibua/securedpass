'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DATABASE_ID, ORGANIZATIONS_COLLECTION_ID, MEMBERS_COLLECTION_ID, MEMBERSHIP_PLANS_COLLECTION_ID, databases, Query } from '@/lib/appwrite';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MemberPayment from '@/components/member/MemberPayment';
import { format, addMonths, addYears } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { MembershipPlan, Organization, Member } from '@/types';


// Add proper interface for data state
interface MemberDashboardData {
  plans: MembershipPlan[];
  organization: Organization | null;
  memberDetails: Member | null;
}

export default function MemberPlansPage() {
  const { organizationId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<MemberDashboardData>({
    plans: [],
    organization: null,
    memberDetails: null,
  });
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Use useMemo for derived state to avoid re-renders
  const { plans, organization, memberDetails } = useMemo(() => data, [data]);
  // Stable userId reference
  const userId = useMemo(() => user?.$id, [user?.$id]);
  
  // Check if member has an active subscription
  const hasActiveSubscription = useMemo(() => {
    return memberDetails?.planId !== undefined && memberDetails?.planId !== null;
  }, [memberDetails]);

  const fetchData = useCallback(async () => {
    if (!userId || !organizationId) return;
    try {
      setLoading(true);
      setError(null);
      // Fetch all data in parallel
      const [plansResponse, orgResponse, memberResponse] = await Promise.all([
        databases.listDocuments(
          DATABASE_ID,
          MEMBERSHIP_PLANS_COLLECTION_ID as string,
          [Query.equal('organizationId', organizationId as string)]
        ),
        databases.getDocument(
          DATABASE_ID,
          ORGANIZATIONS_COLLECTION_ID,
          organizationId as string
        ),
        databases.listDocuments(
          DATABASE_ID,
          MEMBERS_COLLECTION_ID,
          [
            Query.equal('organizationId', organizationId as string),
            Query.equal('userId', userId)
          ]
        )
      ]);
      
      // Update all state at once to avoid multiple renders
      setData({
        plans: plansResponse.documents as unknown as MembershipPlan[],
        organization: orgResponse as unknown as Organization,
        memberDetails: memberResponse.documents[0] as unknown as Member
      });
    } catch (error: unknown) {
      console.error("Error fetching data:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data. Database collections may not be properly configured.';
      console.error("Error fetching data:", errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, organizationId]);
  
  useEffect(() => {
    if (user && organizationId) {
      fetchData();
    }
  }, [organizationId, user, fetchData]);

  const handleSelectPlan = (planId: string) => {
    if (hasActiveSubscription) {
      toast.error("You already have an active subscription. Please manage your current subscription first.");
      return;
    }
    setSelectedPlanId(planId);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[240px] w-full rounded-lg" />
          <Skeleton className="h-[240px] w-full rounded-lg" />
          <Skeleton className="h-[240px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Error</h1>
        <p className="text-muted-foreground text-center max-w-md">{error}</p>
        <Button onClick={fetchData} className="mt-4">Retry</Button>
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

  if (selectedPlanId) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <Button 
          variant="outline" 
          onClick={() => setSelectedPlanId(null)}
          className="mb-6"
        >
          ← Back to all plans
        </Button>
        
        <MemberPayment 
          organizationId={organizationId as string} 
          planId={selectedPlanId as string} 
        />
      </div>
    );
  }

  // Add global subscription notice at the top if member has an active subscription
  const renderSubscriptionNotice = () => {
    if (hasActiveSubscription) {
      const currentPlan = plans.find(plan => plan.$id === memberDetails.planId);
      return (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <h3 className="font-medium text-amber-800 dark:text-amber-300 mb-1">
            You have an active subscription
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            You are currently subscribed to {currentPlan?.name || "a membership plan"}. 
            To change plans, please cancel your current subscription first.
          </p>
          <Button
            variant="outline" 
            size="sm"
            className="mt-2 bg-white dark:bg-transparent"
            onClick={() => router.push(`/member-portal/${organizationId}/subscription`)}
          >
            Manage Subscription
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto py-4 md:py-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{organization.name} Membership Plans</h1>
        <p className="text-muted-foreground">Choose a membership plan that works for you</p>
      </div>
      
      {renderSubscriptionNotice()}
      
      {plans.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No Plans Available</h3>
            <p className="text-muted-foreground">
              This organization hasn&apos;t created any membership plans yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = plan.$id === memberDetails?.planId;
            const features = plan.features ? 
              (typeof plan.features === 'string' ? (plan.features as string).split('\n') : plan.features) : 
              [];
            
            // Calculate expiry date if this is the current plan
            let expiryDate = null;
            if (isCurrentPlan && memberDetails?.planStartDate) {
              const startDate = new Date(memberDetails.planStartDate);
              if (plan.interval === 'monthly') {
                expiryDate = addMonths(startDate, 1);
              } else if (plan.interval === 'yearly') {
                expiryDate = addYears(startDate, 1);
              }
            }
            
            return (
              <Card 
                key={plan.$id} 
                className={isCurrentPlan ? "border-primary" : ""}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {formatPrice(plan.price, plan.interval)}
                      </CardDescription>
                    </div>
                    {isCurrentPlan && (
                      <Badge className="bg-primary">Current Plan</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{plan.description}</p>
                  {features.length > 0 && (
                    <ul className="space-y-2">
                      {features.map((feature: string, index: number) => (
                        <li key={index} className="text-sm flex items-start">
                          <Check className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
                <CardFooter>
                  {isCurrentPlan ? (
                    <div className="w-full">
                      <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-100 dark:border-green-800 mb-3">
                        <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                          Your subscription is active
                        </p>
                        {expiryDate && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Renews on {format(expiryDate, 'PPP')}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push(`/member-portal/${organizationId}/subscription`)}
                      >
                        View Subscription
                      </Button>
                    </div>
                  ) : hasActiveSubscription ? (
                    <div className="w-full">
                      <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-100 dark:border-amber-800 mb-3">
                        <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                          You already have an active subscription
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled
                      >
                        Change Plan Not Available
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleSelectPlan(plan.$id)}
                      disabled={hasActiveSubscription}
                    >
                      Pay Now
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
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