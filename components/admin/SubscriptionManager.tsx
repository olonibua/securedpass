'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { DATABASE_ID, CUSTOMFIELDS_COLLECTION_ID, ORGANIZATIONS_COLLECTION_ID,  databases, Query, CHECKINS_COLLECTION_ID, ORGANIZATIONS_MEMBERS_COLLECTION_ID } from '@/lib/appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { Organization } from '@/types';

interface SubscriptionManagerProps {
  organizationId: string;
  currentPlan?: string;
  paymentModel?: 'subscription' | 'transaction_fee';
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      'Up to 50 check-ins per month',
      '1 admin user',
      'Basic analytics',
      'Email support',
    ],
    limits: {
      checkInsPerMonth: 50,
      adminUsers: 1,
      customFields: 3,
    }
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    features: [
      'Up to 500 check-ins per month',
      '3 admin users',
      'Advanced analytics',
      'Email & chat support',
      'Custom branding',
      'Export data to CSV',
    ],
    limits: {
      checkInsPerMonth: 500,
      adminUsers: 3,
      customFields: 10,
    }
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 99,
    features: [
      'Unlimited check-ins',
      'Unlimited admin users',
      'Advanced analytics & reporting',
      'Priority support',
      'Custom branding',
      'API access',
      'Data retention for 1 year',
    ],
    limits: {
      checkInsPerMonth: Infinity,
      adminUsers: Infinity,
      customFields: Infinity,
    }
  }
];

export default function SubscriptionManager({ 
  organizationId,
  currentPlan,
  paymentModel = 'subscription'
}: SubscriptionManagerProps) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [currentUsage, setCurrentUsage] = useState({
    checkInsThisMonth: 0,
    adminUsers: 0,
    customFields: 0,
  });

  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch organization details
        const org = await databases.getDocument(
          DATABASE_ID!,
          ORGANIZATIONS_COLLECTION_ID!,
          organizationId
        );
        setOrganization(org as unknown as Organization);
        
        // Fetch current month's check-ins count
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        const checkInsResponse = await databases.listDocuments(
          DATABASE_ID!,
          CHECKINS_COLLECTION_ID!,
          [
            Query.equal('organizationId', organizationId),
            Query.greaterThanEqual('timestamp', firstDayOfMonth),
          ]
        );
        
        // Fetch admin users count
        const adminsResponse = await databases.listDocuments(
          DATABASE_ID!,
          ORGANIZATIONS_MEMBERS_COLLECTION_ID!,
          [
            Query.equal('organizationId', organizationId),
            Query.equal('role', 'admin'),
          ]
        );
        
        // Fetch custom fields count
        const fieldsResponse = await databases.listDocuments(
          DATABASE_ID,
          CUSTOMFIELDS_COLLECTION_ID ,
          [Query.equal('organizationId', organizationId)]
        );
        
        setCurrentUsage({
          checkInsThisMonth: checkInsResponse.total,
          adminUsers: adminsResponse.total,
          customFields: fieldsResponse.total,
        });
        
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch subscription data';
        console.error('Error fetching subscription data:', errorMessage);
        toast.error('Error fetching subscription data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizationId]);

  const handleUpgrade = async (planId: string) => {
    try {
      setProcessingPayment(true);
      
      // In a real implementation, you would:
      // 1. Create a checkout session with Stripe/Paystack
      // 2. Redirect the user to the payment page
      // 3. Handle the webhook callback to update the subscription
      
      // For this example, we'll simulate a successful payment
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          planId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      // const data = await response.json();
      
      // In a real implementation, redirect to checkout
      // window.location.href = data.checkoutUrl;
      
      // For this example, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update organization plan
      const now = new Date();
      const expiryDate = new Date();
      expiryDate.setFullYear(now.getFullYear() + 1);
      
      await databases.updateDocument(
        DATABASE_ID!,
        ORGANIZATIONS_COLLECTION_ID!,
        organizationId,
        {
          plan: planId,
          planExpiryDate: expiryDate.toISOString(),
        }
      );
      
      // Fetch updated organization
      const updatedOrg = await databases.getDocument(
        DATABASE_ID!,
        ORGANIZATIONS_COLLECTION_ID!,
        organizationId
      );
      
      setOrganization(updatedOrg as unknown as Organization);
      
      toast.success(`Successfully upgraded to ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan!`);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process payment';
      console.error('Error processing payment:', errorMessage);
      toast.error('Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Organization not found.</p>
      </div>
    );
  }

  const selectedPlan = PLANS.find(plan => plan.id === organization.plan) || PLANS[0];
  const isOwner = organization.ownerId === user?.$id;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Subscription Management</h2>
        <p className="text-muted-foreground">
          Manage your organization&apos;s subscription plan and billi.
        </p>
      </div>
      
      <div className="bg-muted p-4 rounded-md">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h3 className="font-medium">Current Plan</h3>
            <div className="flex items-center mt-1">
              <span className="text-xl font-bold">{selectedPlan.name}</span>
              <Badge variant="outline" className="ml-2">
                {selectedPlan.id === 'free' ? 'Free' : `$${selectedPlan.price}/month`}
              </Badge>
            </div>
            
            {organization.planExpiryDate && organization.plan !== 'free' && (
              <p className="text-sm text-muted-foreground mt-1">
                Expires on {new Date(organization.planExpiryDate).toLocaleDateString()}
              </p>
            )}
          </div>
          
          <div>
            <h3 className="font-medium">Current Usage</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-1">
              <div>
                <p className="text-sm text-muted-foreground">Check-ins this month</p>
                <p className="font-medium">
                  {currentUsage.checkInsThisMonth} / 
                  {selectedPlan.limits.checkInsPerMonth === Infinity 
                    ? '∞' 
                    : selectedPlan.limits.checkInsPerMonth}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admin users</p>
                <p className="font-medium">
                  {currentUsage.adminUsers} / 
                  {selectedPlan.limits.adminUsers === Infinity 
                    ? '∞' 
                    : selectedPlan.limits.adminUsers}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Custom fields</p>
                <p className="font-medium">
                  {currentUsage.customFields} / 
                  {selectedPlan.limits.customFields === Infinity 
                    ? '∞' 
                    : selectedPlan.limits.customFields}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map(plan => (
          <Card key={plan.id} className={
            plan.id === organization.plan 
              ? 'border-primary' 
              : ''
          }>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                {plan.id === 'free' 
                  ? 'Free forever' 
                  : `$${plan.price} per month`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {plan.id === organization.plan ? (
                <Button disabled className="w-full">
                  Current Plan
                </Button>
              ) : (
                <Button 
                  onClick={() => handleUpgrade(plan.id)} 
                  disabled={processingPayment || !isOwner}
                  className="w-full"
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    plan.id === 'free' ? 'Downgrade' : 'Upgrade'
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {!isOwner && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Only the organization owner can change subscription plans
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Contact the organization owner to request a plan change.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
