'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, UserCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { DATABASE_ID, databases, MEMBERS_COLLECTION_ID, CHECKINS_COLLECTION_ID, Query } from '@/lib/appwrite';
import { ID, Models } from 'appwrite';

interface MembershipCheckInProps {
  organization: any; // Replace with proper type
  user: any;
  authLoaded: boolean;
}

export default function MembershipCheckIn({ organization, user, authLoaded }: MembershipCheckInProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [memberInfo, setMemberInfo] = useState<Models.Document | null>(null);
  const [isCheckingMember, setIsCheckingMember] = useState(true);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkMemberStatus = async () => {
      if (!user?.email || !authLoaded) return;
      
      try {
        setIsCheckingMember(true);
        
        const membersResponse = await databases.listDocuments(
          DATABASE_ID,
          MEMBERS_COLLECTION_ID,
          [
            Query.equal("organizationId", organization.$id),
            Query.equal("email", user.email)
          ]
        );
        
        if (membersResponse.documents.length > 0) {
          setMemberInfo(membersResponse.documents[0]);
          console.log("Member found:", membersResponse.documents[0].$id);
          
          // Check if already checked in today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const checkInsToday = await databases.listDocuments(
            DATABASE_ID,
            CHECKINS_COLLECTION_ID,
            [
              Query.equal("organizationId", organization.$id),
              Query.equal("memberId", membersResponse.documents[0].memberId),
              Query.greaterThanEqual("checkInTime", today.toISOString()),
              Query.limit(1)
            ]
          );
          
          if (checkInsToday.documents.length > 0) {
            setAlreadyCheckedIn(true);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to check member status';
        console.error("Error checking member status:", errorMessage);
      } finally {
        setIsCheckingMember(false);
      }
    };

    checkMemberStatus();
  }, [user, authLoaded, organization]);

  const checkInMember = async (memberId: string) => {
    if (!memberInfo) {
      setError("Member information not found");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Record the check-in
      await databases.createDocument(
        DATABASE_ID,
        CHECKINS_COLLECTION_ID,
        ID.unique(),
        {
          organizationId: organization.$id,
          memberId: memberId,
          name: memberInfo.name,
          email: memberInfo.email,
          timestamp: new Date().toISOString(),
          checkInMethod: 'Member Portal'
        }
      );
      
      // Update the member's last check-in time
      await databases.updateDocument(
        DATABASE_ID,
        MEMBERS_COLLECTION_ID,
        memberInfo.$id,
        {
          lastCheckIn: new Date().toISOString()
        }
      );
      
      setSuccess(`Welcome, ${memberInfo.name}! Check-in successful.`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check in';
      console.error('Check-in error:', errorMessage);
      setError('An error occurred during check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || isCheckingMember) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If member is recognized and authenticated, show direct check-in option
  if (memberInfo) {
    return (
      <div className="container max-w-md mx-auto py-12 px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Member Check-In</CardTitle>
            <CardDescription>
              {memberInfo
                ? `Welcome back, ${memberInfo.name}!`
                : `Welcome, ${user?.email}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {success ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Check-in Successful
                </h3>
                <p className="text-muted-foreground">
                  You&apos;ve been checked in to {organization.name}.
                </p>
                <Button
                  className="mt-6"
                  onClick={() =>
                    router.push(`/member-portal/${organization.$id}`)
                  }
                >
                  Go to Member Dashboard
                </Button>
              </div>
            ) : alreadyCheckedIn ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Already Checked In Today
                </h3>
                <p className="text-muted-foreground">
                  You&apos;ve already checked in to {organization.name} today.
                </p>
                <Button
                  className="mt-6"
                  onClick={() =>
                    router.push(`/member-portal/${organization.$id}`)
                  }
                >
                  Go to Member Dashboard
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  <UserCircle className="h-16 w-16 text-primary mb-4" />
                </div>
                <Button
                  className="w-full"
                  onClick={() => 
                    memberInfo ? checkInMember(memberInfo.memberId) : 
                    router.push(`/member-login?redirect=/check-in/${organization.$id}`)
                  }
                >
                  {memberInfo ? 'Check In Now' : 'Sign In'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default check-in page for membership organizations (non-authenticated users)
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
              : 'Sign in to check in'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center p-4">
              <div className="text-green-500 text-xl mb-2">✓</div>
              <p>Your check-in has been recorded.</p>
              <p className="text-sm text-muted-foreground mt-2">
                You can close this page now.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-sm text-center mb-4">
                  Already a member? <Button variant="link" className="p-0 h-auto" onClick={() => router.push(`/member-login?redirect=/check-in/${organization.$id}`)}>Sign in</Button>
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 