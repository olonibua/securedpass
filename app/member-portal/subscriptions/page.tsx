'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { databases, DATABASE_ID, MEMBERS_COLLECTION_ID, ORGANIZATIONS_COLLECTION_ID, Query } from '@/lib/appwrite';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import SubscriptionPauseManager from '@/components/member/SubscriptionPauseManager';
import { Organization, Member } from '@/types';

export default function MemberSubscriptionsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<Member | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Get member record
        const memberResponse = await databases.listDocuments(
          DATABASE_ID,
          MEMBERS_COLLECTION_ID,
          [Query.equal('userId', user.$id)]
        );
        
        if (memberResponse.documents.length === 0) {
          throw new Error('Member record not found');
        }
        
        const member = memberResponse.documents[0] as unknown as Member;
        setMembership(member);
        
        // Get organization
        const organization = await databases.getDocument(
          DATABASE_ID,
          ORGANIZATIONS_COLLECTION_ID,
          member.organizationId
        );
        
        setOrganization(organization as unknown as Organization);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load subscription data';
        console.error('Error fetching member subscription data:', errorMessage);
        toast.error('Failed to load subscription information');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Your Subscription</h1>
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  if (!membership || !organization) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Your Subscription</h1>
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-muted-foreground">
              No subscription information found
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Your Subscription</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
            <CardDescription>
              Your current subscription information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Subscription details would go here */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Organization</h3>
                <p className="text-muted-foreground">{organization.name}</p>
              </div>
              
              <div>
                <h3 className="font-medium">Membership Status</h3>
                <p className="text-muted-foreground">{membership.status}</p>
              </div>
              
              {/* Other subscription details here */}
            </div>
          </CardContent>
        </Card>
        
        {/* Only show pause manager if user has a subscription ID */}
        {membership.subscriptionId && (
          <SubscriptionPauseManager 
            userId={user?.$id || ''}
            organizationId={membership.organizationId}
            subscriptionId={membership.subscriptionId}
          />
        )}
      </div>
    </div>
  );
} 