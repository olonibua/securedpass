'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { databases, Query } from '@/lib/appwrite';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Organization, CustomField } from '@/types';
import DynamicRegistrationForm from '@/components/registration/DynamicRegistrationForm';
import { DATABASE_ID, ORGANIZATIONS_COLLECTION_ID, CUSTOMFIELDS_COLLECTION_ID } from '@/lib/appwrite';

export default function JoinOrganizationPage() {
  const { organizationId } = useParams();
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch organization details
        const orgResponse = await databases.getDocument(
          DATABASE_ID,
          ORGANIZATIONS_COLLECTION_ID,
          organizationId as string
        );
        
        setOrganization(orgResponse as unknown as Organization);
        
        // Fetch custom fields for this organization
        const fieldsResponse = await databases.listDocuments(
          DATABASE_ID,
          CUSTOMFIELDS_COLLECTION_ID,
          [
            Query.equal('organizationId', organizationId as string),
            Query.orderAsc('order')
          ]
        );
        
        setCustomFields(fieldsResponse.documents as unknown as CustomField[]);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
        console.error('Error fetching data:', errorMessage);
        toast.error('Failed to load organization information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizationId]);

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      const response = await fetch('/api/membership/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          ...data
        }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      setSubmitted(true);
      toast.success('Registration successful!');
      
      // Redirect to member portal after successful registration
      setTimeout(() => {
        router.push('/member-portal');
      }, 2000);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to submit registration';
      console.error('Error submitting registration:', errorMessage);
      toast.error('Failed to register');
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
      <div className="container max-w-md mx-auto py-10">
        <Card>
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

  return (
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Register as a member of {organization.name}</CardTitle>
          <CardDescription className="text-center">
            {submitted 
              ? 'Registration successful! Redirecting to member portal...'
              : 'Complete the form below to register as a member'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center py-6">
              <p className="mb-4">Thank you for registering!</p>
              <p className="text-muted-foreground">
                You are now a member of {organization.name}.
              </p>
            </div>
          ) : (
            <DynamicRegistrationForm 
              organizationId={organizationId as string} 
              customFields={customFields as CustomField[]}
              onSubmit={handleSubmit} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
} 