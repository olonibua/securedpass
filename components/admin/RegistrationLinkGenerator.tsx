'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Copy, Share2, RefreshCw } from 'lucide-react';
import { DATABASE_ID, databases, ID, Query, REGISTRATION_CODES_COLLECTION_ID } from '@/lib/appwrite';

interface RegistrationLinkGeneratorProps {
  organizationId: string;
  organizationName: string;
}

export default function RegistrationLinkGenerator({ 
  organizationId, 
  organizationName 
}: RegistrationLinkGeneratorProps) {
  const [registrationCode, setRegistrationCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchOrCreateRegistrationCode();
  }, [organizationId]);
  
  const fetchOrCreateRegistrationCode = async () => {
    try {
      setLoading(true);
      
      // Try to fetch existing registration code
      const response = await databases.listDocuments(
        DATABASE_ID,
        REGISTRATION_CODES_COLLECTION_ID as string,
        [Query.equal('organizationId', organizationId)]
      );
      
      if (response.documents.length > 0) {
        // Use existing code
        setRegistrationCode(response.documents[0].code);
      } else {
        // Create new registration code
        await generateNewCode();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch registration code';
      console.error('Error fetching registration code:', errorMessage);
      toast.error('Failed to load registration code');
    } finally {
      setLoading(false);
    }
  };
  
  const generateNewCode = async () => {
    try {
      setLoading(true);
      
      // Generate a unique code based on org name and random string
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      const orgPrefix = organizationName.substring(0, 3).toUpperCase();
      const newCode = `${orgPrefix}-${randomPart}`;
      
      // Delete any existing codes
      const existingCodes = await databases.listDocuments(
        DATABASE_ID,
        REGISTRATION_CODES_COLLECTION_ID as string,
        [Query.equal('organizationId', organizationId)]
      );
      
      for (const doc of existingCodes.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          REGISTRATION_CODES_COLLECTION_ID as string,
          doc.$id
        );
      }
      
      // Create new registration code
      await databases.createDocument(
        DATABASE_ID,
        REGISTRATION_CODES_COLLECTION_ID as string,
        ID.unique(),
        {
          organizationId,
          code: newCode,
          createdAt: new Date().toISOString()
        }
      );
      
      setRegistrationCode(newCode);
      toast.success('New registration code generated');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate registration code';
      console.error('Error generating registration code:', errorMessage);
      toast.error('Failed to generate registration code');
    } finally {
      setLoading(false);
    }
  };
  
  const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register/${registrationCode}`;
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopied(true);
      toast.success('Registration link copied to clipboard');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to copy link';
      console.error('Error copying link:', errorMessage);
      toast.error('Failed to copy link');
    }
  };
  
  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Register for our organization',
          text: 'Use this link to register for our organization',
          url: registrationUrl,
        });
        toast.success('Link shared successfully');
      } catch (error: unknown) {
        if ((error as Error).name !== 'AbortError') {
          const errorMessage = error instanceof Error ? error.message : 'Failed to share link';
          console.error('Error sharing link:', errorMessage);
          toast.error('Failed to share link');
        }
      }
    } else {
      copyToClipboard();
    }
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Member Registration Link</h3>
      <p className="text-sm text-muted-foreground">
        Share this link with people to register as members of your organization
      </p>
      
      <div className="flex space-x-2">
        <Input 
          value={registrationUrl}
          readOnly
          className="flex-1"
        />
        <Button onClick={copyToClipboard} variant="outline">
          <Copy className="h-4 w-4 mr-2" />
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button onClick={shareLink}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>
      
      <div className="pt-2">
        <Button 
          onClick={generateNewCode} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Generate New Link
        </Button>
        <p className="text-xs text-muted-foreground mt-1">
          Note: Generating a new link will invalidate the previous one
        </p>
      </div>
    </div>
  );
} 