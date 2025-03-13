'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DATABASE_ID, ORGANIZATIONS_COLLECTION_ID, MEMBERS_COLLECTION_ID, MEMBERSHIP_PLANS_COLLECTION_ID, databases, Query } from '@/lib/appwrite';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { Organization } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function MemberPlansPage() {
  const { organizationId } = useParams();
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [memberDetails, setMemberDetails] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    if (user && organizationId) {
      fetchData();
    }
  }, [organizationId, user]);

  const fetchData = async () => {
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
          Query.equal('organizationId', organizationId as string),
          Query.equal('email', user?.email || '')
        ]
      );
      
      if (memberResponse.documents.length > 0) {
        setMemberDetails(memberResponse.documents[0]);
      }
      
      // Fetch all active plans for this organization
      const plansResponse = await databases.listDocuments(
        DATABASE_ID!,
        MEMBERSHIP_PLANS_COLLECTION_ID!,
        [
          Query.equal('organizationId', organizationId as string),
          Query.equal('isActive', true),
          Query.orderAsc('price')
        ]
      );
      
      setPlans(plansResponse.documents);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      console.error("Error fetching data:", errorMessage);
      toast.error('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setSubscribing(planId);
      
      // Update member's plan in the database
      await databases.updateDocument(
        DATABASE_ID!,
        MEMBERS_COLLECTION_ID!,
        memberDetails.$id,
        {
          planId: planId,
          planStartDate: new Date().toISOString(),
          planStatus: 'active'
        }
      );
      
      toast.success('Successfully subscribed to plan!');
      
      // Refresh data
      fetchData();
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe';
      console.error('Error subscribing to plan:', errorMessage);
      toast.error('Failed to subscribe to plan');
    } finally {
      setSubscribing(null);
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
        <p className="text-muted-foreground">You don't have an active membership with this organization.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{organization.name} Membership Plans</h1>
        <p className="text-muted-foreground">Choose a membership plan that works for you</p>
      </div>
      
      {plans.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No Plans Available</h3>
            <p className="text-muted-foreground">
              This organization hasn't created any membership plans yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = plan.$id === memberDetails.planId;
            const features = plan.features ? 
              (typeof plan.features === 'string' ? plan.features.split('\n') : plan.features) : 
              [];
            
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
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => handleSubscribe(plan.$id)}
                      disabled={subscribing === plan.$id}
                    >
                      {subscribing === plan.$id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        plan.interval === 'one-time' ? 'Purchase' : 'Subscribe'
                      )}
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