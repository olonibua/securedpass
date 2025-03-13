'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { databases, Query } from '@/lib/appwrite';
import { 
  DATABASE_ID, 
  MEMBERS_COLLECTION_ID, 
  ORGANIZATIONS_COLLECTION_ID, 
  MEMBERSHIP_PLANS_COLLECTION_ID,
  ORGANIZATIONS_MEMBERS_COLLECTION_ID,
  SUBSCRIPTIONS_COLLECTION_ID
} from '@/lib/appwrite';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Building, Check, CalendarDays, User, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';



interface MembershipPlan {
  $id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
  isActive: boolean;
}

interface Subscription {
  $id: string;
  userId: string;
  planId: string;
  organizationId: string;
  status: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export default function MemberPortalPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<any>(null);
  const [memberDetails, setMemberDetails] = useState<any>(null);
  const [membershipPlans, setMembershipPlans] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState<MembershipPlan | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (!user?.email) {
          console.log('No user email found:', user);
          throw new Error('User not authenticated');
        }

        console.log('Authenticated User:', user);

        // First try to get member details from organizations_members collection
        let membersResponse = await databases.listDocuments(
          DATABASE_ID,
          ORGANIZATIONS_MEMBERS_COLLECTION_ID,
          [Query.equal('userId', user.$id)]
        );

        console.log('Organizations Members Response:', membersResponse);

        // If not found in organizations_members, try the members collection
        if (membersResponse.documents.length === 0) {
          console.log('No record in ORGANIZATIONS_MEMBERS_COLLECTION_ID, trying MEMBERS_COLLECTION_ID');
          membersResponse = await databases.listDocuments(
            DATABASE_ID,
            MEMBERS_COLLECTION_ID,
            [Query.equal('email', user.email)]
          );
          console.log('Members Collection Response:', membersResponse);
        }

        if (membersResponse.documents.length > 0) {
          const memberDoc = membersResponse.documents[0];
          console.log('Member Document:', memberDoc);
          setMemberDetails(memberDoc);
          
          // Fetch organization details
          const org = await databases.getDocument(
            DATABASE_ID,
            ORGANIZATIONS_COLLECTION_ID,
            memberDoc.organizationId
          );
          console.log('Organization Details:', org);
          setOrganization(org);

          // Fetch all active membership plans for this organization
          const plansResponse = await databases.listDocuments(
            DATABASE_ID,
            MEMBERSHIP_PLANS_COLLECTION_ID as string,
            [
              Query.equal('organizationId', memberDoc.organizationId),
              Query.equal('isActive', true),
            ]
          );
          console.log('Membership Plans:', plansResponse.documents);
          setMembershipPlans(plansResponse.documents);

          // Enhanced subscription fetching with better logging
          try {
            console.log('Fetching subscription details for user:', user.$id);
            const subscriptionsResponse = await databases.listDocuments(
              DATABASE_ID,
              SUBSCRIPTIONS_COLLECTION_ID,
              [
                Query.equal('userId', user.$id),
                Query.equal('organizationId', memberDoc.organizationId),
                Query.equal('status', 'active')
              ]
            );
            
            console.log('Subscription Response:', subscriptionsResponse);
            
            if (subscriptionsResponse.documents.length > 0) {
              const activeSubscription = subscriptionsResponse.documents[0];
              console.log('Active Subscription Found:', activeSubscription);
              setSubscription(activeSubscription as unknown as Subscription);
              
              // Fetch current plan details
              if (activeSubscription.planId) {
                const currentPlanDoc = await databases.getDocument(
                  DATABASE_ID,
                  MEMBERSHIP_PLANS_COLLECTION_ID as string,
                  activeSubscription.planId || ''
                );
                console.log('Current Plan Details:', currentPlanDoc);
                setCurrentPlan(currentPlanDoc as unknown as MembershipPlan);
              }
            } else {
              console.log('No active subscription found');
            }
          } catch (error) {
            console.error('Error fetching subscription:', error);
          }
        } else {
          console.log('No member document found for user:', user.$id, 'or email:', user.email);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load membership data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      console.log('Starting data fetch for user:', user);
      fetchData();
    } else {
      console.log('No user available');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container py-10">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              You are not a member of any organization.
            </p>
            <Button onClick={() => router.push('/organizations/search')}>
              Find Organizations to Join
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container py-10 max-w-6xl"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Card className="mb-8 border-2 border-primary/10 shadow-md overflow-hidden">
          <CardHeader className="bg-muted/30">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-3xl font-bold">{organization.name}</CardTitle>
                <CardDescription className="text-base mt-1">{organization.description}</CardDescription>
              </div>
              <Badge variant="outline" className="text-sm px-3 py-1 bg-primary/5">
                <Building className="h-3.5 w-3.5 mr-1" />
                {organization.type || 'Membership Organization'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-8 md:grid-cols-2">
              <motion.div 
                className="space-y-6"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <User className="h-5 w-5 mr-2 text-primary" />
                    Your Membership
                  </h3>
                  <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Member since:</span>
                      <span className="text-sm">
                        {memberDetails.createdAt 
                          ? formatDate(memberDetails.createdAt) 
                          : formatDate(new Date().toISOString())}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge variant={memberDetails.status === 'active' ? 'success' : 'secondary'}>
                        {memberDetails.status || 'Active'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Subscription:</span>
                      {subscription ? (
                        <Badge variant="outline" className="bg-primary/10">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted">
                          Not Subscribed
                        </Badge>
                      )}
                    </div>
                    {subscription ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Subscribed since:</span>
                          <span className="text-sm">
                            {formatDate(subscription.startDate)}
                          </span>
                        </div>
                        {subscription.endDate && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Subscription ends:</span>
                            <span className="text-sm">
                              {formatDate(subscription.endDate)}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Subscribed since:</span>
                        <span className="text-sm text-muted-foreground">
                          Not yet subscribed
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {currentPlan ? (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-primary" />
                      Current Plan
                    </h3>
                    <Card className="border-primary/20 hover:shadow-md transition-all">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle>{currentPlan.name}</CardTitle>
                          <Badge className="bg-primary">${currentPlan.price}/{currentPlan.interval}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <p className="text-sm text-muted-foreground mb-2">{currentPlan.description}</p>
                        {subscription && (
                          <div className="flex items-center mt-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            Active since {formatDate(subscription.startDate)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-primary" />
                      Current Plan
                    </h3>
                    <Card className="border-dashed border-2 border-muted hover:border-primary/20 transition-all">
                      <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground mb-4">
                          You don't have an active subscription plan
                        </p>
                        <Button 
                          onClick={() => router.push(`/member-portal/${organization.$id}/plans`)}
                          className="hover:bg-primary/90 transition-colors"
                        >
                          Choose a Plan
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
              
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <CalendarDays className="h-5 w-5 mr-2 text-primary" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline"
                    className="h-auto py-6 flex flex-col items-center justify-center hover:bg-primary/5 transition-colors"
                    onClick={() => router.push(`/check-in/${organization.$id}`)}
                  >
                    <Calendar className="h-6 w-6 mb-2" />
                    <span>Check In</span>
                  </Button>
                  
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Available Plans</h2>
          {currentPlan && (
            <Badge variant="outline" className="px-3 py-1">
              Current: {currentPlan.name}
            </Badge>
          )}
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {membershipPlans.map((plan, index) => {
            const isCurrentPlan = currentPlan?.$id === plan.$id;
            const features = Array.isArray(plan.features) ? plan.features : 
                            (typeof plan.features === 'string' ? JSON.parse(plan.features) : []);
            
            return (
              <motion.div
                key={plan.$id}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + (index * 0.1), duration: 0.4 }}
              >
                <Card 
                  className={`transition-all hover:shadow-md ${isCurrentPlan ? "border-primary border-2" : ""}`}
                >
                  <CardHeader className={isCurrentPlan ? "bg-primary/5" : ""}>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription className="mt-1">
                          ${plan.price}/{plan.interval}
                        </CardDescription>
                      </div>
                      {isCurrentPlan && (
                        <Badge className="bg-primary">Current</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
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
                  <CardFooter className="pt-2 pb-4">
                    {isCurrentPlan ? (
                      <Button className="w-full" variant="outline" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button 
                        className="w-full hover:bg-primary/90 transition-colors"
                        onClick={() => router.push(`/member-portal/${organization.$id}/plans`)}
                      >
                        Choose Plan
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}