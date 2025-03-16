'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { databases, DATABASE_ID, ORGANIZATIONS_COLLECTION_ID } from '@/lib/appwrite';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PaymentModelSelector from '@/components/organization/PaymentModelSelector';
import PaymentIntegration from '@/components/organization/PaymentIntegration';
import PaymentSettingsInfo from '@/components/organization/PaymentSettingsInfo';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SubscriptionManager from '@/components/admin/SubscriptionManager';

export default function PaymentSettingsPage() {
  const params = useParams();
  const organizationId = params.organizationId as string;
  
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadOrganization() {
      try {
        setLoading(true);
        const org = await databases.getDocument(
          DATABASE_ID,
          ORGANIZATIONS_COLLECTION_ID,
          organizationId
        );
        setOrganization(org);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load organization data';
        console.error('Error loading organization:', errorMessage);
        toast.error('Failed to load organization data');
      } finally {
        setLoading(false);
      }
    }
    
    if (organizationId) {
      loadOrganization();
    }
  }, [organizationId]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!organization) {
    return (
      <div className="text-center p-6">
        <h2 className="text-xl font-semibold">Organization not found</h2>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment Settings</h1>
        <p className="text-muted-foreground">
          Configure how you pay for our platform and how your members pay you
        </p>
      </div>
      
      <PaymentSettingsInfo 
        paymentModel={organization.paymentModel || 'subscription'}
        transactionFeePercentage={organization.transactionFeePercentage || 5}
      />
      
      <Tabs defaultValue="model" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="model">Payment Model</TabsTrigger>
          {organization.paymentModel === 'subscription' && (
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          )}
          {organization.paymentModel === 'subscription' && (
            <TabsTrigger value="integration">Payment Integration</TabsTrigger>
          )}
          {organization.paymentModel === 'transaction_fee' && (
            <TabsTrigger value="bank">Bank Details</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="model">
          <PaymentModelSelector 
            organizationId={organizationId}
            currentModel={organization.paymentModel || 'subscription'}
            transactionFeePercentage={organization.transactionFeePercentage || 5}
          />
        </TabsContent>
        
        <TabsContent value="subscription">
            <SubscriptionManager
              organizationId={organizationId}
              currentPlan={organization.plan || 'free'}
              paymentModel={organization.paymentModel || 'subscription'}
            />
        </TabsContent>
        
        <TabsContent value="integration">
          <PaymentIntegration 
            organizationId={organizationId}
            paystackIntegrated={Boolean(organization.paystackPublicKey)}
          />
        </TabsContent>
        
        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle>Bank Account Details</CardTitle>
              <CardDescription>
                Provide your bank account details for receiving payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Since you've chosen the Transaction Fee model, we need your bank account details to transfer your funds.
                Please contact our support team at support@securedpass.com to set up your settlement account.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 