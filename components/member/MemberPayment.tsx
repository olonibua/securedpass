'use client';

import { useState, useEffect } from 'react';
import { PaystackButton } from 'react-paystack';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2,  AlertCircle } from 'lucide-react';
import { databases, DATABASE_ID, ORGANIZATIONS_COLLECTION_ID, MEMBERSHIP_PLANS_COLLECTION_ID, MEMBERSHIP_PURCHASES_COLLECTION_ID } from '@/lib/appwrite';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { Organization } from '@/types';
import { MembershipPlan } from '@/types';

interface MemberPaymentProps {
  organizationId: string;
  planId: string;
}

interface PaystackResponse {
  reference: string;
  status: string;
  transaction?: string;
  message?: string;
}

export default function MemberPayment({ organizationId, planId }: MemberPaymentProps) {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<MembershipPlan | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Load organization data to determine payment model
        const org = await databases.getDocument(
          DATABASE_ID,
          ORGANIZATIONS_COLLECTION_ID,
          organizationId
        );

        // Load plan details
        const planData = await databases.getDocument(
          DATABASE_ID,
          MEMBERSHIP_PLANS_COLLECTION_ID || "",
          planId
        );

        setOrganization(org as unknown as Organization);
        setPlan(planData as unknown as MembershipPlan);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Default error message";
        console.error("Error loading payment data:", errorMessage);

        toast.error("Failed to load payment information");
      } finally {
        setLoading(false);
      }
    }
    
    if (organizationId && planId) {
      loadData();
    }
  }, [organizationId, planId]);
  
  const handlePaymentSuccess = async (response: PaystackResponse) => {
    try {
      // Record membership purchase in the database
      await databases.createDocument(
        DATABASE_ID,
        MEMBERSHIP_PURCHASES_COLLECTION_ID,
        'unique()',
        {
          organizationId,
          planId,
          userId: user?.$id,
          amount: plan?.price || 0,
          transactionReference: response.reference,
          paymentDate: new Date().toISOString(),
          status: 'completed',
          // Record payment model used for internal tracking
          paymentModelUsed: (organization as Organization).paymentModel || 'subscription'
        }
      );
      
      toast.success('Payment successful! Your membership is now active.');
      // Redirect to receipt or dashboard
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Default error message";
      console.error("Error recording payment:", errorMessage);
      toast.error('Payment received but there was an issue activating your membership. Please contact support.');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!plan || !organization) {
    return (
      <div className="text-center p-6">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <h2 className="text-xl font-semibold">Plan information not found</h2>
        <p className="text-muted-foreground mt-2">
          Please select a different plan or contact the organization
        </p>
      </div>
    );
  }
  
  // Determine which Paystack key to use based on organization's payment model
  const paystackKey = organization?.paymentModel === 'subscription'
    ? organization?.paystackPublicKey 
    : (process.env.NEXT_PUBLIC_PLATFORM_PAYSTACK_PUBLIC_KEY as string);
  
  // For transaction fee model, calculate fee amount (will be handled on server during transfer)
  const amount = plan.price * 100; // Paystack requires amount in kobo/cents
  
  const config = {
    reference: `MEMBERSHIP_${Date.now()}_${planId.substring(0, 8)}`,
    email: user?.email || '',
    amount,
    publicKey: paystackKey || '',
    metadata: {
      custom_fields: [
        { display_name: "Organization ID", variable_name: "organizationId", value: organizationId },
        { display_name: "Plan ID", variable_name: "planId", value: planId },
        { display_name: "User ID", variable_name: "userId", value: user?.$id },
          { display_name: "Payment Model", variable_name: "paymentModel", value: organization?.paymentModel },
        ...(organization?.paymentModel === 'transaction_fee' ? [
          { display_name: "Fee Percentage", variable_name: "transactionFeePercentage", value: organization?.transactionFeePercentage }
        ] : [])
      ]
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{plan.name} Membership</CardTitle>
        <CardDescription>
          {plan.description || "Join now and enjoy the benefits of membership"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-primary/10 p-4 rounded-md">
            <div className="text-2xl font-bold">
              ₦{plan.price.toLocaleString()}
              {plan.interval && (
                <span className="text-sm font-normal">/{plan.interval}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {(plan as MembershipPlan).intervalDescription || "One-time payment"}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">What&apos;s included:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm pl-2">
              {plan.features ? (
                typeof plan.features === "string" ? (
                  plan.features
                    .split(",")
                    .map((feature: string, index: number) => (
                      <li key={index}>{feature.trim()}</li>
                    ))
                ) : Array.isArray(plan.features) ? (
                  plan.features.map((feature: string, index: number) => (
                    <li key={index}>{feature.trim()}</li>
                  ))
                ) : (
                  <li>Full membership access</li>
                )
              ) : (
                <li>Full membership access</li>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {user ? (
          paystackKey ? (
            <PaystackButton
              {...config}
              onSuccess={handlePaymentSuccess}
              onClose={() => toast.info("Payment canceled")}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded-md"
              text="Pay Now"
            />
          ) : (
            <div className="w-full text-center text-amber-600 p-3 bg-amber-50 rounded-md">
              <AlertCircle className="h-5 w-5 mx-auto mb-2" />
              <p className="text-sm">
                Payment is currently unavailable for this organization. Please
                try again later or contact the organization.
              </p>
            </div>
          )
        ) : (
          <Button className="w-full" asChild>
            <a
              href={`/login?redirectTo=/member-portal/${organizationId}/plans`}
            >
              Log in to continue
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 