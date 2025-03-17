'use client';

import { useState, useEffect } from 'react';
import { databases, DATABASE_ID, ORGANIZATIONS_COLLECTION_ID } from '@/lib/appwrite';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, LockIcon } from 'lucide-react';
import { differenceInDays, addDays, format } from 'date-fns';

interface SubscriptionPauseSettingsProps {
  organizationId: string;
}

export default function SubscriptionPauseSettings({ organizationId }: SubscriptionPauseSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allowPauses, setAllowPauses] = useState(false);
  const [maxPauses, setMaxPauses] = useState(1);
  const [maxDuration, setMaxDuration] = useState(30); // Default max 30 days
  const [lastModified, setLastModified] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [daysUntilUnlocked, setDaysUntilUnlocked] = useState(0);
  const [unlockDate, setUnlockDate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const organization = await databases.getDocument(
          DATABASE_ID,
          ORGANIZATIONS_COLLECTION_ID,
          organizationId
        );
        
        setAllowPauses(organization.allowSubscriptionPauses || false);
        setMaxPauses(organization.maxPausesPerMonth || 1);
        setMaxDuration(organization.maxPauseDuration || 30);
        setLastModified(organization.pauseSettingsLastModified || null);
        
        // Calculate if settings are locked
        if (organization.pauseSettingsLastModified) {
          const lastModDate = new Date(organization.pauseSettingsLastModified);
          const nextAllowedDate = addDays(lastModDate, 30);
          const today = new Date();
          
          const locked = today < nextAllowedDate;
          setIsLocked(locked);
          
          if (locked) {
            const daysLeft = differenceInDays(nextAllowedDate, today);
            setDaysUntilUnlocked(daysLeft);
            setUnlockDate(nextAllowedDate);
          }
        } else {
          setIsLocked(false);
        }
        
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load subscription pause settings';
        console.error('Error fetching subscription pause settings:', errorMessage);
        toast.error('Failed to load subscription settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [organizationId]);

  const saveSettings = async () => {
    if (isLocked) {
      toast.error(`Settings are locked for ${daysUntilUnlocked} more days`);
      return;
    }
    
    try {
      setSaving(true);
      
      // Add the last modified timestamp to the update
      await databases.updateDocument(
        DATABASE_ID,
        ORGANIZATIONS_COLLECTION_ID,
        organizationId,
        {
          allowSubscriptionPauses: allowPauses,
          maxPausesPerMonth: maxPauses,
          maxPauseDuration: maxDuration,
          pauseSettingsLastModified: new Date().toISOString()
        }
      );
      
      toast.success('Subscription pause settings saved');
      
      // Update the locked status after saving
      setIsLocked(true);
      setDaysUntilUnlocked(30);
      setUnlockDate(addDays(new Date(), 30));
      setLastModified(new Date().toISOString());
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save subscription pause settings';
      console.error('Error saving subscription pause settings:', errorMessage);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Subscription Pause Settings
          {isLocked && (
            <div className="flex items-center text-amber-600">
              <LockIcon className="h-4 w-4 mr-1" />
              <span className="text-sm font-normal">Locked</span>
            </div>
          )}
        </CardTitle>
        <CardDescription>
          Configure whether members can pause their subscriptions and how often
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {isLocked && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
                <p className="text-amber-800 text-sm flex items-center">
                  <LockIcon className="h-4 w-4 mr-2" />
                  Settings are locked for {daysUntilUnlocked} more days
                </p>
                <p className="text-amber-700 text-xs mt-1">
                  You can make changes again after {unlockDate ? format(unlockDate, 'MMMM d, yyyy') : '30 days'}
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allowPauses" className="font-medium">
                  Allow Members to Pause Subscriptions
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, members can pause their active subscriptions
                </p>
              </div>
              <Switch
                id="allowPauses"
                checked={allowPauses}
                onCheckedChange={setAllowPauses}
                disabled={saving || isLocked}
              />
            </div>

            {allowPauses && (
              <>
                <div className="grid gap-4 py-2">
                  <div>
                    <Label htmlFor="maxPauses">Maximum Pauses Per Month</Label>
                    <Input
                      id="maxPauses"
                      type="number"
                      min="1"
                      max="10"
                      value={maxPauses}
                      onChange={(e) => setMaxPauses(parseInt(e.target.value) || 1)}
                      disabled={saving || isLocked}
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      How many times a member can pause their subscription in a month
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="maxDuration">Maximum Pause Duration (Days)</Label>
                    <Input
                      id="maxDuration"
                      type="number"
                      min="1"
                      max="90"
                      value={maxDuration}
                      onChange={(e) => setMaxDuration(parseInt(e.target.value) || 30)}
                      disabled={saving || isLocked}
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Maximum number of days a subscription can be paused
                    </p>
                  </div>
                </div>
              </>
            )}

            <Button 
              onClick={saveSettings} 
              disabled={saving || isLocked} 
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isLocked ? (
                <>
                  <LockIcon className="mr-2 h-4 w-4" />
                  Locked for {daysUntilUnlocked} days
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
            
            {lastModified && !isLocked && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Last updated on {format(new Date(lastModified), 'MMMM d, yyyy')}
              </p>
            )}
            
            <div className="border-t pt-4 mt-4">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> To ensure stability for your members, subscription pause settings can only be changed once every 30 days.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 