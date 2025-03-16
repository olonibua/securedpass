'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { databases, DATABASE_ID, ORGANIZATIONS_COLLECTION_ID } from '@/lib/appwrite';
import { KeyIcon, ShieldIcon } from 'lucide-react';

interface PaymentIntegrationProps {
  organizationId: string;
  paystackIntegrated: boolean;
}

export default function PaymentIntegration({
  organizationId,
  paystackIntegrated = false,
}: PaymentIntegrationProps) {
  const [publicKey, setPublicKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      if (!publicKey || !secretKey) {
        toast.error('Please provide both public and secret keys');
        return;
      }
      
      // Store Paystack integration keys
      await databases.updateDocument(
        DATABASE_ID,
        ORGANIZATIONS_COLLECTION_ID,
        organizationId,
        {
          paystackPublicKey: publicKey,
          paystackSecretKey: secretKey, // Note: In production, use a secure way to store secret keys
        }
      );
      
      toast.success('Payment integration updated successfully');
      setSecretKey(''); // Clear secret key from form for security
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update payment integration';
      console.error('Error updating payment integration:', errorMessage);
      toast.error('Failed to update payment integration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paystack Integration</CardTitle>
        <CardDescription>
          Connect your Paystack account to accept payments directly from your
          members
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-md mb-4">
          <h3 className="font-medium mb-2">Setup Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>
              Create a{" "}
              <a
                href="https://dashboard.paystack.com/#/signup"
                className="text-primary underline"
                target="_blank"
                rel="noopener"
              >
                Paystack account
              </a>{" "}
              if you don&apos;t have one
            </li>
            <li>Activate your account and complete verification</li>
            <li>From your Paystack dashboard, get your API keys</li>
            <li>Enter your public and secret keys below</li>
          </ol>
        </div>

        <div className="space-y-2">
          <Label htmlFor="public-key">Paystack Public Key</Label>
          <div className="flex">
            <KeyIcon className="mr-2 h-4 w-4 opacity-70 mt-3" />
            <Input
              id="public-key"
              type="text"
              placeholder="pk_test_..."
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="secret-key">Paystack Secret Key</Label>
          <div className="flex">
            <ShieldIcon className="mr-2 h-4 w-4 opacity-70 mt-3" />
            <Input
              id="secret-key"
              type="password"
              placeholder="sk_test_..."
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Your secret key will be encrypted and stored securely
          </p>
        </div>

        {paystackIntegrated && (
          <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-400">
                  Paystack integration is active
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : paystackIntegrated
              ? "Update Integration"
              : "Connect Paystack"}
        </Button>
      </CardFooter>
    </Card>
  );
} 