'use client';

import { useState, useEffect } from 'react';
import { databases, Query } from '@/lib/appwrite';
import { DATABASE_ID, CHECKINS_COLLECTION_ID } from '@/lib/appwrite';
import { format } from 'date-fns';
import { CalendarDays, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Models } from 'appwrite';

interface CheckInHistoryProps {
  organizationId: string;
  memberId: string;
}

export default function CheckInHistory({ organizationId, memberId }: CheckInHistoryProps) {
  const [checkIns, setCheckIns] = useState<Models.Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCheckIns = async () => {
      try {
        setLoading(true);
        const response = await databases.listDocuments(
          DATABASE_ID,
          CHECKINS_COLLECTION_ID,
          [
            Query.equal('organizationId', organizationId),
            Query.equal('memberId', memberId),
            Query.orderDesc('timestamp')
          ]
        );
        
        setCheckIns(response.documents);
      } catch (error) {
        console.error('Error fetching check-ins:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCheckIns();
  }, [organizationId, memberId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (checkIns.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">No check-ins recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Recent Check-ins</h3>
      
      {checkIns.slice(0, 10).map((checkIn) => (
        <Card key={checkIn.$id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center p-4 border-l-4 border-primary">
              <div className="mr-4">
                <CalendarDays className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium">
                  {format(new Date(checkIn.timestamp), 'EEEE, MMMM d, yyyy')}
                </div>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {format(new Date(checkIn.timestamp), 'h:mm a')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 