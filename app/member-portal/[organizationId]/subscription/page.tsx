'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { databases, Query } from '@/lib/appwrite';
import { 
  DATABASE_ID, 
  ORGANIZATIONS_COLLECTION_ID, 
  SUBSCRIPTIONS_COLLECTION_ID,
  CHECKINS_COLLECTION_ID
} from '@/lib/appwrite';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, Calendar as CalendarIcon, PauseCircle, PlayCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import MembershipPlans from '@/components/member/MembershipPlans';

interface MemberDetails {
  $id: string;
  planId?: string;
  planStartDate?: string;
  planStatus?: 'active' | 'inactive';
  email: string;
}

interface MembershipPlan {
  $id: string;
  name: string;
  description: string;
  price: number;
  interval: 'monthly' | 'yearly' | 'one-time';
  features: string[];
}

interface PaymentHistory {
  $id: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  date: string;
  description: string;
}

export default function SubscriptionPage() {
  const { organizationId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [organization, setOrganization] = useState<any>(null);
  const [isPausingSubscription, setIsPausingSubscription] = useState(false);
  const [isResumingSubscription, setIsResumingSubscription] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(null);
  const [currentPlan, setCurrentPlan] = useState<MembershipPlan | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  
  // Calculate days until subscription ends
  const daysUntilEnd = subscription?.endDate 
    ? Math.ceil((new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  // Calculate subscription progress
  const subscriptionProgress = subscription?.endDate && subscription?.startDate
    ? Math.round(((new Date().getTime() - new Date(subscription.startDate).getTime()) / 
      (new Date(subscription.endDate).getTime() - new Date(subscription.startDate).getTime())) * 100)
    : 0;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch organization details
      if (organizationId) {
        const org = await databases.getDocument(
          DATABASE_ID,
          ORGANIZATIONS_COLLECTION_ID,
          organizationId as string
        );
        setOrganization(org);
      }
      
      // Fetch subscription details
      const subscriptionsResponse = await databases.listDocuments(
        DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        [
          Query.equal('userId', user?.$id || ''),
          ...(organizationId ? [Query.equal('organizationId', organizationId as string)] : []),
          Query.equal('status', 'active')
        ]
      );
      
      if (subscriptionsResponse.documents.length > 0) {
        setSubscription(subscriptionsResponse.documents[0]);
      }
      
      // Fetch check-ins
      const checkInsResponse = await databases.listDocuments(
        DATABASE_ID,
        CHECKINS_COLLECTION_ID,
        [
          Query.equal('userId', user?.$id || ''),
          ...(organizationId ? [Query.equal('organizationId', organizationId as string)] : [])
        ]
      );
      
      setCheckIns(checkInsResponse.documents);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch subscription data';
      console.error('Error fetching subscription data:', errorMessage);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  }, [organizationId, user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, organizationId, fetchData]);

  const handlePauseSubscription = async () => {
    if (!subscription) return;
    
    try {
      setIsPausingSubscription(true);
      
      // Check if pauses are allowed
      if (subscription.pausesUsed >= subscription.pauseAllowed) {
        toast.error('You have used all your allowed pauses');
        return;
      }
      
      // Update subscription in database
      await databases.updateDocument(
        DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        subscription.$id,
        {
          isPaused: true,
          pauseDate: new Date().toISOString(),
          pausesUsed: subscription.pausesUsed + 1
        }
      );
      
      toast.success('Subscription paused successfully');
      fetchData(); // Refresh data
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to pause subscription';
      console.error('Error pausing subscription:', errorMessage);
      toast.error('Failed to pause subscription');
    } finally {
      setIsPausingSubscription(false);
    }
  };

  const handleResumeSubscription = async () => {
    if (!subscription) return;
    
    try {
      setIsResumingSubscription(true);
      
      // Calculate new end date (extend by pause duration)
      let newEndDate = subscription.endDate;
      if (subscription.pauseDate) {
        const pauseDuration = new Date().getTime() - new Date(subscription.pauseDate).getTime();
        const originalEndDate = new Date(subscription.endDate).getTime();
        newEndDate = new Date(originalEndDate + pauseDuration).toISOString();
      }
      
      // Update subscription in database
      await databases.updateDocument(
        DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        subscription.$id,
        {
          isPaused: false,
          endDate: newEndDate,
          pauseDate: null
        }
      );
      
      toast.success('Subscription resumed successfully');
      fetchData(); // Refresh data
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resume subscription';
      console.error('Error resuming subscription:', errorMessage);
      toast.error('Failed to resume subscription');
    } finally {
      setIsResumingSubscription(false);
    }
  };

  // Function to check if a day should be highlighted (has check-in)
  const isDayHighlighted = (date: Date) => {
    return checkIns.some(checkIn => {
      const checkInDate = new Date(checkIn.date || checkIn.timestamp);
      return (
        checkInDate.getDate() === date.getDate() &&
        checkInDate.getMonth() === date.getMonth() &&
        checkInDate.getFullYear() === date.getFullYear()
      );
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        {organization && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{organization.name} Subscription</h1>
            <p className="text-muted-foreground">
              Manage your membership with {organization.name}
            </p>
          </div>
        )}
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Status</CardTitle>
                  <CardDescription>Your current membership details</CardDescription>
                </CardHeader>
                <CardContent>
                  {subscription ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Badge variant={subscription.isPaused ? "outline" : "default"}>
                            {subscription.isPaused ? "Paused" : "Active"}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Start Date</span>
                          <span className="font-medium">{formatDate(subscription.startDate)}</span>
                        </div>
                        
                        {subscription.endDate && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">End Date</span>
                            <span className="font-medium">{formatDate(subscription.endDate)}</span>
                          </div>
                        )}
                        
                        {subscription.pauseDate && subscription.isPaused && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Paused On</span>
                            <span className="font-medium">{formatDate(subscription.pauseDate)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Pauses Used</span>
                          <span className="font-medium">{subscription.pausesUsed || 0} / {subscription.pauseAllowed || 0}</span>
                        </div>
                      </div>
                      
                      {subscription.endDate && !subscription.isPaused && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Days Remaining</span>
                            <span className="font-medium">{daysUntilEnd} days</span>
                          </div>
                          <Progress value={subscriptionProgress} className="h-2" />
                          <p className="text-xs text-muted-foreground text-right">{subscriptionProgress}% complete</p>
                        </div>
                      )}
                      
                      <div className="pt-4">
                        {subscription.isPaused ? (
                          <Button 
                            onClick={handleResumeSubscription}
                            disabled={isResumingSubscription}
                            className="w-full sm:w-auto"
                          >
                            {isResumingSubscription ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Resuming...
                              </>
                            ) : (
                              <>
                                <PlayCircle className="mr-2 h-4 w-4" />
                                Resume Subscription
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button 
                            onClick={handlePauseSubscription}
                            disabled={isPausingSubscription || (subscription.pausesUsed >= subscription.pauseAllowed)}
                            variant="outline"
                            className="w-full sm:w-auto"
                          >
                            {isPausingSubscription ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Pausing...
                              </>
                            ) : (
                              <>
                                <PauseCircle className="mr-2 h-4 w-4" />
                                Pause Subscription
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      
                      {subscription.pausesUsed >= subscription.pauseAllowed && !subscription.isPaused && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>No pauses remaining</AlertTitle>
                          <AlertDescription>
                            You have used all your allowed subscription pauses.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Active Subscription</h3>
                      <p className="text-muted-foreground">You don&apos;t have an active subscription plan</p>
                      <p className="text-muted-foreground">This organization hasn&apos;t created any membership plans yet.</p>
                      <Button onClick={() => window.location.href = `/member-portal/${organizationId}/plans`}>
                        View Available Plans
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {subscription && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Recent Check-ins</CardTitle>
                    <CardDescription>Your last 5 check-ins</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {checkIns.length > 0 ? (
                      <div className="space-y-4">
                        {checkIns.slice(0, 5).map(checkIn => (
                          <div key={checkIn.$id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center">
                              <CalendarIcon className="h-5 w-5 mr-3 text-primary" />
                              <span>{formatDate(checkIn.date || checkIn.timestamp)}</span>
                            </div>
                            <Badge variant="outline">{new Date(checkIn.date || checkIn.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">No check-ins recorded yet</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle>Check-in Calendar</CardTitle>
                <CardDescription>View your gym attendance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    className="rounded-md border"
                    modifiers={{
                      highlighted: isDayHighlighted
                    }}
                    modifiersStyles={{
                      highlighted: { backgroundColor: 'rgba(var(--primary), 0.1)' }
                    }}
                  />
                  
                  <div className="mt-6 w-full max-w-md">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Legend</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded bg-primary/10 mr-2"></div>
                        <span className="text-sm">Check-in day</span>
                      </div>
                      {subscription?.endDate && (
                        <div className="flex items-center">
                          <div className="w-4 h-4 rounded border-2 border-red-500 mr-2"></div>
                          <span className="text-sm">Subscription end date ({formatDate(subscription.endDate)})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="plans">
            <Card>
              <CardHeader>
                <CardTitle>Available Plans</CardTitle>
                <CardDescription>
                  {organization 
                    ? `Upgrade or change your membership plan with ${organization.name}`
                    : 'Upgrade or change your membership plan'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {organization ? (
                  <MembershipPlans 
                    organizationId={organizationId as string} 
                    currentPlanId={subscription?.planId}
                    organizationName={organization.name} 
                  />
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Organization Not Found</h3>
                    <p className="text-muted-foreground">
                      The organization information couldn't be loaded.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
} 