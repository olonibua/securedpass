'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { databases, DATABASE_ID, CHECKINS_COLLECTION_ID, Query } from '@/lib/appwrite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CheckIn {
  $id: string;
  name: string;
  email: string;
  timestamp: string;
  checkInMethod: string;
}

interface DailyCheckIns {
  date: string;
  formattedDate: string;
  checkIns: CheckIn[];
}

export default function CheckInsPage() {
  const { organizationId } = useParams();
  const [loading, setLoading] = useState(true);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [dailyCheckIns, setDailyCheckIns] = useState<DailyCheckIns[]>([]);
  const [openDays, setOpenDays] = useState<Set<string>>(new Set());

  const fetchCheckIns = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await databases.listDocuments(
        DATABASE_ID!,
        CHECKINS_COLLECTION_ID!,
        [
          Query.equal('organizationId', organizationId as string),
          Query.orderDesc('timestamp'),
          Query.limit(500)
        ]
      );
      
      setCheckIns(response.documents as unknown as CheckIn[]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load check-ins';
      console.error('Error loading check-ins:', errorMessage);
      toast.error('Failed to load check-ins');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Group check-ins by day
  useEffect(() => {
    if (checkIns.length > 0) {
      const grouped: Record<string, CheckIn[]> = {};
      
      // Group check-ins by date
      checkIns.forEach(checkIn => {
        const date = new Date(checkIn.timestamp);
        const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (!grouped[dateString]) {
          grouped[dateString] = [];
        }
        
        grouped[dateString].push(checkIn);
      });
      
      // Convert to array and sort by date (newest first)
      const result: DailyCheckIns[] = Object.keys(grouped).map(date => {
        const displayDate = new Date(date);
        return {
          date,
          formattedDate: displayDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          checkIns: grouped[date]
        };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setDailyCheckIns(result);
      
      // Automatically open today's section
      const today = new Date().toISOString().split('T')[0];
      if (grouped[today]) {
        setOpenDays(new Set([today]));
      } else if (result.length > 0) {
        // If today has no check-ins, open the most recent day
        setOpenDays(new Set([result[0].date]));
      }
    }
  }, [checkIns]);

  useEffect(() => {
    if (organizationId) {
      fetchCheckIns();
    }
  }, [organizationId, fetchCheckIns]);

  const toggleDay = (date: string) => {
    setOpenDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

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
        <h1 className="text-2xl font-bold tracking-tight">Check-ins</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Daily Check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyCheckIns.length > 0 ? (
            <div className="space-y-4">
              {dailyCheckIns.map((day) => (
                <Collapsible 
                  key={day.date} 
                  open={openDays.has(day.date)} 
                  onOpenChange={() => toggleDay(day.date)}
                  className="border rounded-md"
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-secondary/20 focus:outline-none">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-primary" />
                      <span className="font-medium">{day.formattedDate}</span>
                      <span className="ml-3 bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                        {day.checkIns.length} {day.checkIns.length === 1 ? 'check-in' : 'check-ins'}
                      </span>
                    </div>
                    {openDays.has(day.date) ? 
                      <ChevronDown className="h-5 w-5" /> : 
                      <ChevronRight className="h-5 w-5" />
                    }
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="overflow-x-auto p-4 pt-0">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="p-2 pb-2">Time</th>
                            <th className="p-2 pb-2">Member</th>
                            <th className="p-2 pb-2">Email</th>
                            <th className="p-2 pb-2">Method</th>
                          </tr>
                        </thead>
                        <tbody>
                          {day.checkIns.map((checkIn) => (
                            <tr key={checkIn.$id} className="border-b hover:bg-secondary/10">
                              <td className="p-2 py-2">
                                {new Date(checkIn.timestamp).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td className="p-2 py-2">{checkIn.name}</td>
                              <td className="p-2 py-2">{checkIn.email}</td>
                              <td className="p-2 py-2">{checkIn.checkInMethod || 'Web'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No check-ins yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Check-ins will appear here when members start using your system.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 