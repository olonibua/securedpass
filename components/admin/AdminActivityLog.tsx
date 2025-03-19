'use client';
import { useState, useEffect, useCallback } from 'react';
import { databases, DATABASE_ID, ADMIN_ACTIVITY_COLLECTION_ID, Query } from '@/lib/appwrite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Activity } from 'lucide-react';

interface AdminActivity {
  $id: string;
  organizationId: string;
  adminId: string;
  adminName: string;
  action: string;
  details: string;
  timestamp: string;
}

interface AdminActivityLogProps {
  organizationId: string;
}

export default function AdminActivityLog({ organizationId }: AdminActivityLogProps) {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        ADMIN_ACTIVITY_COLLECTION_ID,
        [
          Query.equal('organizationId', organizationId),
          Query.orderDesc('timestamp'),
          Query.limit(100) // Limit to most recent 100 activities
        ]
      );
      
      setActivities(response.documents as unknown as AdminActivity[]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch activity logs';
      console.error('Error fetching activity logs:', errorMessage);
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Helper to format the activity action into a readable string
  const formatAction = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Administrator Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No activity recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.$id} className="flex items-start gap-4 border-b pb-4">
                <div className="bg-primary/10 rounded-full p-2">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between mb-1">
                    <p className="font-medium">{activity.adminName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm"><strong>{formatAction(activity.action)}</strong></p>
                  <p className="text-sm text-muted-foreground">{activity.details}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 