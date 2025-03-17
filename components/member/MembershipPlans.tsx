'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check } from 'lucide-react';
import { DATABASE_ID, MEMBERSHIP_PLANS_COLLECTION_ID, databases, Query } from '@/lib/appwrite';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { MembershipPlan } from '@/types'; 

interface MembershipPlansProps {
  organizationId: string;
  currentPlanId?: string;
  organizationName?: string;
}

export default function MembershipPlans({ 
  organizationId, 
  currentPlanId,
  organizationName 
}: MembershipPlansProps) {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        MEMBERSHIP_PLANS_COLLECTION_ID as string,
        [
          Query.equal("organizationId", organizationId as string),
          Query.equal("isActive", true),
          Query.orderAsc("price"),
        ]
      );

      setPlans(response.documents as unknown as MembershipPlan[]);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch plans";
      console.error("Error fetching membership plans:", errorMessage);
      toast.error("Failed to load membership plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [organizationId, fetchPlans]);

  

  const handleSubscribe = async (planId: string) => {
    try {
      setSubscribing(planId);
      
      // Here you would integrate with your payment processor (Stripe, etc.)
      // For now, we'll just simulate a subscription process
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      toast.success('Successfully subscribed to plan!');
      // After successful subscription, you would update the member's plan in your database
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe';
      console.error('Error subscribing to plan:', errorMessage);
      toast.error('Failed to subscribe to plan');
    } finally {
      setSubscribing(null);
    }
  };

  const formatPrice = (price: number, interval: string) => {
    if (interval === 'one-time') {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toFixed(2)}/${interval === 'monthly' ? 'mo' : 'yr'}`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No membership plans available at this time.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {organizationName && (
        <p className="text-muted-foreground">
          Select a membership plan to continue with {organizationName}
        </p>
      )}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlanId ? plan.$id === currentPlanId : false;
          
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
                {(plan.features?.length || 0) > 0 && (
                  <ul className="space-y-2">
                    {typeof plan.features === 'string' 
                      ? plan.features.split(',').map((feature: string, index: number) => (
                          <li key={index} className="text-sm flex items-start">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            {feature.trim()}
                          </li>
                        ))
                      : plan.features?.map((feature: string, index: number) => (
                          <li key={index} className="text-sm flex items-start">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            {feature}
                          </li>
                        ))
                    }
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
    </div>
  );
}