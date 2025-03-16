'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DATABASE_ID, databases, ORGANIZATIONS_COLLECTION_ID, CHECKINS_COLLECTION_ID, MEMBERS_COLLECTION_ID, Query } from '@/lib/appwrite';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, UserCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { ID, Models } from 'appwrite';

export default function CheckInPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.organizationId as string;
  const { user: _user, isLoaded: authLoaded } = useAuth();
  
  const [organization, setOrganization] = useState<Models.Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [memberInfo, setMemberInfo] = useState<Models.Document | null>(null);
  const [isCheckingMember, setIsCheckingMember] = useState(true);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setIsCheckingMember(true);
        
        // Fetch organization data
        const org = await databases.getDocument(
          DATABASE_ID!,
          ORGANIZATIONS_COLLECTION_ID!,
          organizationId
        );
        setOrganization(org);
        
        // Log authentication state for debugging
        console.log("Auth state:", { isLoaded: authLoaded, user: _user?.email });
        
        // If user is authenticated, check if they're a member
        if (_user?.email) {
          console.log("Checking if user is a member:", _user.email);
          
          const membersResponse = await databases.listDocuments(
            DATABASE_ID!,
            MEMBERS_COLLECTION_ID!,
            [
              Query.equal("organizationId", organizationId),
              Query.equal("email", _user.email)
            ]
          );
          
          
          if (membersResponse.documents.length > 0) {
            setMemberInfo(membersResponse.documents[0] as Models.Document);
            console.log("Member found:", membersResponse.documents[0].$id);
            
            // Check if already checked in today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const checkInsToday = await databases.listDocuments(
              DATABASE_ID!,
              CHECKINS_COLLECTION_ID!,
              [
                Query.equal("organizationId", organizationId),
                Query.equal("memberId", membersResponse.documents[0].$id),
                Query.greaterThanEqual("timestamp", today.toISOString()),
                Query.limit(1)
              ]
            );
            
            if (checkInsToday.documents.length > 0) {
              setAlreadyCheckedIn(true);
            }
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
        console.error("Error fetching data:", errorMessage);
        toast.error('Failed to load organization data');
      } finally {
        setLoading(false);
        setIsCheckingMember(false);
      }
    };

    if (authLoaded) {
      fetchData();
    }
  }, [organizationId, _user?.email, authLoaded]);

  useEffect(() => {
    // Play success sound when check-in is successful
    if (success) {
      const audio = new Audio('/sounds/success.mp3');
      audio.play().catch(error => {
        console.error('Error playing success sound:', error);
      });
    }
  }, [success]);

  const handleMemberCheckIn = async () => {
    try {
      if (!memberInfo && !_user?.email) {
        toast.error('Member information not available');
        return;
      }
      
      setProcessing(true);
      
      // If we have member info, use it directly
      let memberId = memberInfo?.$id;
      let memberName = memberInfo?.name;
      let memberEmail = memberInfo?.email || _user?.email;
      
      // If we don't have member info but have a logged-in user, try to get/create the member
      if (!memberId && _user?.email) {
        // Try one more time to find the member
        const membersResponse = await databases.listDocuments(
          DATABASE_ID!,
          MEMBERS_COLLECTION_ID!,
          [
            Query.equal("organizationId", organizationId),
            Query.equal("email", _user.email)
          ]
        );
        
        if (membersResponse.documents.length > 0) {
          const member = membersResponse.documents[0];
          memberId = member.$id;
          memberName = member.name;
          memberEmail = member.email;
        }
      }
      
      if (!memberId || !memberEmail) {
        toast.error('Unable to identify member account');
        return;
      }
      
      // Create check-in record
      await databases.createDocument(
        DATABASE_ID!,
        CHECKINS_COLLECTION_ID!,
        ID.unique(),
        {
          organizationId,
          memberId: memberId,
          name: memberName || 'Member',
          email: memberEmail,
          timestamp: new Date().toISOString(),
          checkInMethod: 'qr-code'
        }
      );
      
      setSuccess(true);
      toast.success('Check-in successful!');
      
      // Reset success state after a few seconds
      setTimeout(() => {
        if (organization?.organizationType === 'membership') {
          router.push(`/member-portal/${organizationId}`);
        }
      }, 3000);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check in';
      console.error("Check-in error:", errorMessage);
      toast.error('Failed to check in. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !authLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Organization Not Found</CardTitle>
            <CardDescription className="text-center">
              The organization you&apos;re looking for doesn&apos;t exist or is no longer active.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // If member is recognized and authenticated, show direct check-in option
  if (memberInfo || (_user?.email && !isCheckingMember)) {
    return (
      <div className="container max-w-md mx-auto py-12 px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Member Check-In</CardTitle>
            <CardDescription>
              {memberInfo
                ? `Welcome back, ${memberInfo.name}!`
                : `Welcome, ${_user?.email}`}
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
                    router.push(`/member-portal/${organizationId}`)
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
                    router.push(`/member-portal/${organizationId}`)
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
                  onClick={handleMemberCheckIn}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Check In Now"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

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
                  Already a member? <Button variant="link" className="p-0 h-auto" onClick={() => router.push(`/member-login?redirect=/check-in/${organizationId}`)}>Sign in</Button>
                </p>
              </div>
              
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}