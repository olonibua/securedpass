'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { databases, DATABASE_ID, MEMBERS_COLLECTION_ID, Query, MEMBERSHIP_PURCHASES_COLLECTION_ID, MEMBERSHIP_PLANS_COLLECTION_ID } from '@/lib/appwrite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Plus, Search, CreditCard, Check, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { addMonths, addYears, format } from 'date-fns';

export default function MembersPage() {
  const { organizationId } = useParams();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' or 'subscribed'
  
  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await databases.listDocuments(
        DATABASE_ID!,
        MEMBERS_COLLECTION_ID!,
        [
          Query.equal('organizationId', organizationId as string),
          Query.limit(100)
        ]
      );
      
      // For each member, check if they have an active subscription
      const membersWithSubscriptionStatus = await Promise.all(
        response.documents.map(async (member) => {
          try {
            const purchasesResponse = await databases.listDocuments(
              DATABASE_ID!,
              MEMBERSHIP_PURCHASES_COLLECTION_ID!,
              [
                Query.equal("userId", member.userId || ""),
                Query.equal("organizationId", organizationId as string),
                Query.orderDesc("paymentDate"),
                Query.limit(1),
              ]
            );
            
            const hasActiveSubscription = purchasesResponse.documents.length > 0 && 
              purchasesResponse.documents[0].status === 'completed';
            
            let subscriptionType = 'None';
            let expiryDate = null;
            let planName = '';
            
            if (hasActiveSubscription && purchasesResponse.documents.length > 0) {
              const latestPayment = purchasesResponse.documents[0];
              
              // Fetch plan details to get interval
              try {
                const planResponse = await databases.getDocument(
                  DATABASE_ID!,
                  MEMBERSHIP_PLANS_COLLECTION_ID!,
                  latestPayment.planId
                );
                
                subscriptionType = planResponse.interval || 'one-time';
                planName = planResponse.name || 'Unknown Plan';
                
                // Calculate expiry date based on plan interval
                const paymentDate = new Date(latestPayment.paymentDate);
                if (subscriptionType === 'monthly') {
                  expiryDate = addMonths(paymentDate, 1);
                } else if (subscriptionType === 'yearly') {
                  expiryDate = addYears(paymentDate, 1);
                } else if (subscriptionType === 'one-time') {
                  // For one-time payments, we don't set an expiry
                  expiryDate = null;
                }
              } catch (error) {
                console.error("Error fetching plan details:", error);
              }
            }
            
            return {
              ...member,
              hasActiveSubscription,
              latestPayment: purchasesResponse.documents[0] || null,
              subscriptionType,
              expiryDate,
              planName
            };
          } catch (error) {
            console.error("Error fetching subscription for member:", error);
            return { 
              ...member, 
              hasActiveSubscription: false, 
              latestPayment: null,
              subscriptionType: 'None',
              expiryDate: null,
              planName: ''
            };
          }
        })
      );
      
      setMembers(membersWithSubscriptionStatus);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load members';
      console.error('Error loading members:', errorMessage);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      fetchMembers();
    }
  }, [organizationId, fetchMembers]);

  // Filter members based on search query and subscription status
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         member.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by subscription status if needed
    if (filterType === 'subscribed') {
      return matchesSearch && member.hasActiveSubscription;
    }
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Members</h1>
        {/* <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button> */}
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members by name or email..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <RadioGroup 
          defaultValue="all" 
          className="flex space-x-4"
          value={filterType}
          onValueChange={setFilterType}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="all" />
            <Label htmlFor="all">All Members</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="subscribed" id="subscribed" />
            <Label htmlFor="subscribed">Subscribed Only</Label>
          </div>
        </RadioGroup>
      </div>
      
      <Card>
        <CardHeader className="pb-1.5">
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2 pb-4 font-medium">Name</th>
                    <th className="p-2 pb-4 font-medium">Email</th>
                    <th className="p-2 pb-4 font-medium">Subscription</th>
                    <th className="p-2 pb-4 font-medium">Plan</th>
                    <th className="p-2 pb-4 font-medium">Expires</th>
                    <th className="p-2 pb-4 font-medium">Status</th>
                    <th className="p-2 pb-4 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.$id} className="border-b hover:bg-secondary/10">
                      <td className="p-2 py-3">{member.name || 'Unnamed Member'}</td>
                      <td className="p-2 py-3">{member.email}</td>
                      <td className="p-2 py-3">
                        {member.hasActiveSubscription ? (
                          <Badge variant="default" className="bg-green-500">
                            <Check className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            None
                          </Badge>
                        )}
                      </td>
                      <td className="p-2 py-3">
                        {member.hasActiveSubscription ? (
                          <div className="flex items-center">
                            <CreditCard className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span>{member.planName || 'Unknown'}</span>
                            {member.subscriptionType && member.subscriptionType !== 'one-time' && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {member.subscriptionType}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="p-2 py-3">
                        {member.expiryDate ? (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span>{format(member.expiryDate, 'MMM d, yyyy')}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="p-2 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {member.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="p-2 py-3">{formatDate(member.createdAt)}</td>
                      
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No members yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add members to your organization to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 