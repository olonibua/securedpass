'use client';

import { useState, useEffect } from 'react';
import { databases, DATABASE_ID, ORGANIZATIONS_COLLECTION_ID, SUBSCRIPTION_PAUSES_COLLECTION_ID, Query, ID } from '@/lib/appwrite';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Calendar as CalendarIcon, Pause, Play } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface SubscriptionPauseManagerProps {
  userId: string;
  organizationId: string;
  subscriptionId: string;
}

export default function SubscriptionPauseManager({ userId, organizationId, subscriptionId }: SubscriptionPauseManagerProps) {
  const [loading, setLoading] = useState(true);
  const [pauseHistory, setPauseHistory] = useState<any[]>([]);
  const [pausesRemaining, setPausesRemaining] = useState(0);
  const [maxPauses, setMaxPauses] = useState(0);
  const [maxDuration, setMaxDuration] = useState(30);
  const [allowPauses, setAllowPauses] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get organization settings
        const organization = await databases.getDocument(
          DATABASE_ID,
          ORGANIZATIONS_COLLECTION_ID,
          organizationId
        );
        
        setAllowPauses(organization.allowSubscriptionPauses || false);
        setMaxPauses(organization.maxPausesPerMonth || 0);
        setMaxDuration(organization.maxPauseDuration || 30);
        
        if (!organization.allowSubscriptionPauses) {
          setLoading(false);
          return;
        }
        
        // Fetch pause history for current month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        const pauses = await databases.listDocuments(
          DATABASE_ID,
          SUBSCRIPTION_PAUSES_COLLECTION_ID,
          [
            Query.equal('userId', userId),
            Query.equal('subscriptionId', subscriptionId),
            Query.greaterThanEqual('createdAt', firstDayOfMonth),
            Query.orderDesc('createdAt')
          ]
        );
        
        setPauseHistory(pauses.documents);
        
        // Check if subscription is currently paused
        const activePauses = pauses.documents.filter((pause: any) => {
          const endDate = new Date(pause.endDate);
          return endDate >= now && pause.status === 'active';
        });
        
        setIsPaused(activePauses.length > 0);
        
        // Calculate pauses remaining
        setPausesRemaining(Math.max(0, maxPauses - pauses.documents.length));
        
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load subscription pause data';
        console.error('Error fetching subscription pause data:', errorMessage);
        toast.error('Failed to load subscription data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userId, organizationId, subscriptionId, maxPauses]);
  
  const handlePauseSubscription = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    
    // Calculate duration
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Check if duration exceeds max
    if (diffDays > maxDuration) {
      toast.error(`Pause duration cannot exceed ${maxDuration} days`);
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Create pause record
      await databases.createDocument(
        DATABASE_ID,
        SUBSCRIPTION_PAUSES_COLLECTION_ID,
        ID.unique(),
        {
          userId,
          organizationId,
          subscriptionId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          duration: diffDays,
          status: 'active',
          createdAt: new Date().toISOString()
        }
      );
      
      toast.success('Subscription paused successfully');
      setDialogOpen(false);
      
      // Reload data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to pause subscription';
      console.error('Error pausing subscription:', errorMessage);
      toast.error('Failed to pause subscription');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleResumeSubscription = async () => {
    try {
      setSubmitting(true);
      
      // Find active pause
      const activePauses = pauseHistory.filter(pause => pause.status === 'active');
      if (activePauses.length === 0) {
        toast.error('No active pause found');
        return;
      }
      
      // Update pause status to 'resumed'
      await databases.updateDocument(
        DATABASE_ID,
        SUBSCRIPTION_PAUSES_COLLECTION_ID,
        activePauses[0].$id,
        {
          status: 'resumed',
          endDate: new Date().toISOString()
        }
      );
      
      toast.success('Subscription resumed successfully');
      
      // Reload data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resume subscription';
      console.error('Error resuming subscription:', errorMessage);
      toast.error('Failed to resume subscription');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Update end date when start date changes
  useEffect(() => {
    if (startDate) {
      const newEndDate = new Date(startDate);
      newEndDate.setDate(newEndDate.getDate() + maxDuration);
      setEndDate(newEndDate);
    }
  }, [startDate, maxDuration]);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Pauses</CardTitle>
          <CardDescription>Loading your subscription pause information</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  if (!allowPauses) {
    return null; // Don't show this component if pauses aren't allowed
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Pause className="h-5 w-5 mr-2" /> 
          Subscription Pauses
        </CardTitle>
        <CardDescription>
          Pause your subscription when you're away
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Subscription Status</p>
              <p className="text-sm text-muted-foreground">
                {isPaused ? 'Currently paused' : 'Active'}
              </p>
            </div>
            {isPaused ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleResumeSubscription}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Resume Now
              </Button>
            ) : (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={pausesRemaining === 0 || submitting}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Subscription
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Pause Your Subscription</DialogTitle>
                    <DialogDescription>
                      Select when you want to pause your subscription. 
                      You can pause for up to {maxDuration} days.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Start Date</h3>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, 'PPP') : "Select start date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">End Date</h3>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !startDate && "text-muted-foreground"
                            )}
                            disabled={!startDate}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, 'PPP') : "Select end date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                            disabled={(date) => {
                              if (!startDate) return true;
                              const maxEnd = new Date(startDate);
                              maxEnd.setDate(maxEnd.getDate() + maxDuration);
                              return date < startDate || date > maxEnd;
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button onClick={handlePauseSubscription} disabled={submitting || !startDate || !endDate}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Pause Subscription'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          <div className="rounded-md bg-muted p-3">
            <p className="text-sm">
              <span className="font-medium">Pauses remaining this month:</span> {pausesRemaining} of {maxPauses}
            </p>
            <p className="text-sm mt-1">
              <span className="font-medium">Maximum pause duration:</span> {maxDuration} days
            </p>
          </div>
          
          {pauseHistory.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Recent Pause History</h3>
              <div className="space-y-2">
                {pauseHistory.slice(0, 3).map((pause) => (
                  <div key={pause.$id} className="text-sm p-2 border rounded-md">
                    <div className="flex justify-between">
                      <span>
                        {format(new Date(pause.startDate), 'PP')} - {format(new Date(pause.endDate), 'PP')}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs",
                        pause.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      )}>
                        {pause.status === 'active' ? 'Active' : 'Completed'}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1">Duration: {pause.duration} days</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 