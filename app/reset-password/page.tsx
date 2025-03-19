'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { account } from '@/lib/appwrite';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';

const formSchema = z.object({
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // Parse the URL parameters from the Appwrite recovery link
    // Appwrite typically sends userId and secret as URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const extractedUserId = urlParams.get('userId');
    const extractedSecret = urlParams.get('secret');
    
    if (extractedUserId && extractedSecret) {
      setUserId(extractedUserId);
      setSecret(extractedSecret);
    } else {
      // Missing required parameters
      toast.error('Invalid or expired reset link. Please request a new one.');
      setTimeout(() => router.push('/forgot-password'), 2000);
    }
  }, [router]);

  const onSubmit = async (values: FormValues) => {
    if (!userId || !secret) {
      toast.error('Missing required recovery information');
      return;
    }

    try {
      setLoading(true);
      
      // Complete the password recovery process
      await account.updateRecovery(
        userId,
        secret,
        values.password,
      );
      
      setResetComplete(true);
      toast.success('Password reset successfully! You can now log in with your new password.');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      console.error('Password reset error:', errorMessage);
      toast.error('Unable to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container max-w-md mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Reset Your Password</CardTitle>
            <CardDescription className="text-center">
              {resetComplete 
                ? "Your password has been reset successfully."
                : "Please create a new password for your account."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resetComplete ? (
              <div className="text-center">
                <p className="mb-4">Your password has been updated successfully.</p>
                <div className="flex flex-col space-y-2">
                  <Link href="/login" className="text-primary hover:underline">
                    Log in to organization portal
                  </Link>
                  <Link href="/member-login" className="text-primary hover:underline">
                    Log in to member portal
                  </Link>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            {...field} 
                            disabled={loading || !userId || !secret}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            {...field} 
                            disabled={loading || !userId || !secret}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || !userId || !secret}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
} 