'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DATABASE_ID, databases, ORGANIZATIONS_COLLECTION_ID } from '@/lib/appwrite';
import { toast } from 'sonner';
import DynamicCheckInForm from '@/components/check-in/DynamicCheckInForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function CheckInPage() {
  const params = useParams();
  const organizationId = params.organizationId as string;
  
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setLoading(true);
        const org = await databases.getDocument(
          DATABASE_ID!,
          ORGANIZATIONS_COLLECTION_ID!,
          organizationId
        );
        setOrganization(org);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch organization';
        console.error('Error fetching organization:', errorMessage);
        toast.error('Organization not found or access denied');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [organizationId]);

  const handleCheckIn = async (formData: Record<string, any>) => {
    try {
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          customFieldValues: formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Check-in failed');
      }

      setSuccess(true);
      toast.success('Check-in completed successfully!');
      
      // Reset success state after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete check-in';
      console.error('Error during check-in:', errorMessage);
      toast.error('Failed to complete check-in');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
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
              The organization you're looking for doesn't exist or is no longer active.
            </CardDescription>
          </CardHeader>
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
              <img 
                src={organization.logo} 
                alt={organization.name} 
                className="h-16 w-auto object-contain"
              />
            </div>
          )}
          <CardTitle>{organization.name}</CardTitle>
          <CardDescription>
            {success 
              ? 'Check-in successful! Thank you.'
              : 'Please fill out the form below to check in'}
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
            <DynamicCheckInForm 
              organizationId={organizationId} 
              onSubmit={handleCheckIn} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
} 