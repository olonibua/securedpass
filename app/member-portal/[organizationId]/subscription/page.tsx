'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { databases, DATABASE_ID, MEMBERSHIP_PURCHASES_COLLECTION_ID, MEMBERSHIP_PLANS_COLLECTION_ID, ORGANIZATIONS_COLLECTION_ID, Query } from '@/lib/appwrite';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import SubscriptionPauseManager from '@/components/member/SubscriptionPauseManager';
import { Organization } from '@/types';
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
  planName?: string;
}

export default function SubscriptionHistoryPage() {
  const { organizationId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<MembershipPurchase[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [currentSubscriptionId, setCurrentSubscriptionId] = useState<
    string | null
  >(null);
  const [allowPauses, setAllowPauses] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    if (!user || !organizationId) return;

    try {
      setLoading(true);

      // Fetch all membership purchases for this user and organization
      const purchasesResponse = await databases.listDocuments(
        DATABASE_ID!,
        MEMBERSHIP_PURCHASES_COLLECTION_ID!,
        [
          Query.equal("userId", user.$id),
          Query.equal("organizationId", organizationId as string),
          Query.orderDesc("paymentDate"),
        ]
      );

      const purchases =
        purchasesResponse.documents as unknown as MembershipPurchase[];

      // Fetch plan details for each purchase
      const purchasesWithPlans = await Promise.all(
        purchases.map(async (purchase) => {
          try {
            const planResponse = await databases.getDocument(
              DATABASE_ID!,
              MEMBERSHIP_PLANS_COLLECTION_ID!,
              purchase.planId
            );
            return {
              ...purchase,
              planName: planResponse.name,
            };
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to fetch plan details";
            console.error("Error fetching plan details:", errorMessage);
            return {
              ...purchase,
              planName: "Unknown Plan",
            };
          }
        })
      );

      setSubscriptions(purchasesWithPlans);

      // Set current subscription ID if there is an active subscription
      const activeSubscription = purchasesWithPlans.find(
        (sub) =>
          sub.status === "completed" &&
          new Date(sub.paymentDate) >
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Within last 30 days
      );

      if (activeSubscription) {
        setCurrentSubscriptionId(activeSubscription.$id);
      }

      // Fetch organization to check pause settings
      const organizationResponse = await databases.getDocument(
        DATABASE_ID!,
        ORGANIZATIONS_COLLECTION_ID!,
        organizationId as string
      );

      setOrganization(organizationResponse as unknown as Organization);
      setAllowPauses(organizationResponse.allowSubscriptionPauses || false);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch subscription history";
      console.error("Error fetching subscription history:", errorMessage);
      toast.error("Failed to load subscription history");
    } finally {
      setLoading(false);
    }
  }, [user, organizationId]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  if (loading) {
    return (
      <div className="container py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container px-4 mx-auto py-6 sm:py-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Subscription Management</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Subscription Pause Manager - only show if organization allows pauses and user has active subscription */}
        {allowPauses && currentSubscriptionId && (
          <SubscriptionPauseManager
            userId={user?.$id || ""}
            organizationId={organizationId as string}
            subscriptionId={currentSubscriptionId}
          />
        )}

        {/* Subscription History Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Your Payment History</CardTitle>
            <CardDescription>
              View all your past payments and subscription details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subscriptions.length > 0 ? (
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <div
                    key={subscription.$id}
                    className="p-4 border rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold mb-1">
                        {subscription.planName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Paid on {formatDate(subscription.paymentDate)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Reference: {subscription.transactionReference}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold mb-1">
                        ₦{subscription.amount.toLocaleString()}
                      </div>
                      <Badge
                        variant={
                          subscription.status === "completed"
                            ? "default"
                            : "destructive"
                        }
                        className={
                          subscription.status === "completed"
                            ? "bg-green-500"
                            : ""
                        }
                      >
                        {subscription.status === "completed" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        {subscription.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No subscription history
                </h3>
                <p className="text-muted-foreground">
                  You haven&apos;t made any payments yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 