'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { DATABASE_ID, databases, MEMBERS_COLLECTION_ID, CHECKINS_COLLECTION_ID, Query } from '@/lib/appwrite';
import { ID } from 'appwrite';

interface CompanyCheckInProps {
  organization: any; // Replace with proper type
}

export default function CompanyCheckIn({ organization }: CompanyCheckInProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [memberId, setMemberId] = useState('');

  const checkInMember = async (memberId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Query members collection with the provided ID
      const response = await databases.listDocuments(
        DATABASE_ID,
        MEMBERS_COLLECTION_ID,
        [
          Query.equal('organizationId', organization.$id),
          Query.equal('memberId', memberId),
          Query.equal('active', true)
        ]
      );
      
      if (response.documents.length === 0) {
        setError('Member ID not found or inactive. Please check and try again.');
        return;
      }
      
      const member = response.documents[0];
      
      // Check if already checked in today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const checkInsToday = await databases.listDocuments(
        DATABASE_ID,
        CHECKINS_COLLECTION_ID,
        [
          Query.equal("organizationId", organization.$id),
          Query.equal("memberId", member.memberId),
          Query.greaterThanEqual("checkInTime", today.toISOString()),
          Query.limit(1)
        ]
      );
      
      if (checkInsToday.documents.length > 0) {
        setError(`${member.name} has already checked in today.`);
        return;
      }
      
      // Record the check-in
      await databases.createDocument(
        DATABASE_ID,
        CHECKINS_COLLECTION_ID,
        ID.unique(),
        {
          organizationId: organization.$id,
          memberId: member.memberId,
          name: member.name,
          email: member.email,
          timestamp: new Date().toISOString(),
          checkInMethod: 'Company QR'
        }
      );
      
      // Update the member's last check-in time
      await databases.updateDocument(
        DATABASE_ID,
        MEMBERS_COLLECTION_ID,
        member.$id,
        {
          lastCheckIn: new Date().toISOString()
        }
      );
      
      setSuccess(`Welcome, ${member.name}! Check-in successful.`);
      
      // Reset the form
      setMemberId('');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check in';
      console.error('Check-in error:', errorMessage);
      setError('An error occurred during check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (memberId.trim()) {
      checkInMember(memberId);
    } else {
      setError('Please enter your Member ID');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {organization.logo && (
            <div className="flex justify-center mb-4">
              <Image 
                src={organization.logo} 
                alt={organization.name} 
                width={64}
                height={64}
                className="h-16 w-auto object-contain"
              />
            </div>
          )}
          <CardTitle>{organization.name}</CardTitle>
          <CardDescription>
            {success 
              ? 'Check-in successful! Thank you.'
              : 'Enter your Member ID to check in'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center p-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-xl font-semibold mb-2">{success}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your attendance has been recorded.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="memberId">Member ID</Label>
                  <Input
                    id="memberId"
                    placeholder="Enter your Member ID"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded-md">
                    {error}
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking in...
                    </>
                  ) : (
                    'Check In'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
       
      </Card>
    </div>
  );
} 