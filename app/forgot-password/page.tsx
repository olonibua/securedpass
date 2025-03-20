'use client';

import { useState } from 'react';
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
import Header from '@/components/layout/Header';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      
      // URL to redirect to after password reset
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      // Request password recovery with Appwrite
      await account.createRecovery(values.email, redirectUrl);
      
      // Mark as sent to show success message
      setEmailSent(true);
      toast.success('Password reset email sent! Please check your inbox.');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send recovery email';
      console.error('Password recovery error:', errorMessage);
      toast.error('Unable to process your request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container max-w-md mx-auto py-28 sm:py-28 md:py-44">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Reset Your Password</CardTitle>
            <CardDescription className="text-center">
              {emailSent
                ? "We've sent you an email with instructions to reset your password."
                : "Enter your email address and we'll send you instructions to reset your password."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="text-center">
                <p className="mb-4">
                  Please check your email inbox and follow the instructions to
                  reset your password.
                </p>
                <div className="flex flex-col space-y-2">
                  <Link href="/login" className="text-primary hover:underline">
                    Return to organization login
                  </Link>
                  <Link
                    href="/member-login"
                    className="text-primary hover:underline"
                  >
                    Return to member login
                  </Link>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="your.email@example.com"
                            type="email"
                            {...field}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>

                  <div className="text-center mt-4">
                    <Link
                      href="/login"
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      Return to login
                    </Link>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
} 