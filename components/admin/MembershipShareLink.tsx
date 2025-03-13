'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Copy, Share2 } from 'lucide-react';

interface MembershipShareLinkProps {
  organizationId: string;
}

export default function MembershipShareLink({ organizationId }: MembershipShareLinkProps) {
  const [copied, setCopied] = useState(false);
  
  const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL}/organizations/join/${organizationId}`;
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      
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
          title: 'Join our organization',
          text: 'Apply for membership to our organization',
          url: joinUrl,
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
      <h3 className="text-lg font-medium">Share Membership Link</h3>
      <p className="text-sm text-muted-foreground">
        Share this link with potential members to allow them to apply for membership
      </p>
      
      <div className="flex space-x-2">
        <Input 
          value={joinUrl}
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
    </div>
  );
} 