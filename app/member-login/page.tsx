'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Loader2 } from 'lucide-react';
import { account, DATABASE_ID, MEMBERS_COLLECTION_ID, ORGANIZATIONS_MEMBERS_COLLECTION_ID, databases, ADMINISTRATORS_COLLECTION_ID } from '@/lib/appwrite';
import { toast } from 'sonner';
import { Query } from 'appwrite';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { checkAuth } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      
      // Check if there's already an active session and delete it first
      try {
        await account.get();
        // If we get here, there's an active session - delete it first
        await account.deleteSession('current');
      } catch {
        // No active session, which is what we want
      }
      
      // Sign in with Appwrite
      await account.createEmailPasswordSession(values.email, values.password);
      
      // Get the user
      const user = await account.get();
      
      if (user) {
        // Check if user is a member by searching for their record
        const memberCheck = await databases.listDocuments(
          DATABASE_ID!,
          MEMBERS_COLLECTION_ID!,
          [Query.equal("email", values.email)]
        );
        
        // Also check organizations_members
        const orgMemberCheck = await databases.listDocuments(
          DATABASE_ID!,
          ORGANIZATIONS_MEMBERS_COLLECTION_ID!,
          [Query.equal("userId", user.$id)]
        );
        
        // If no member records found, this user is likely an admin, not a member
        if (memberCheck.documents.length === 0) {
          // Check if they're an admin
          const adminCheck = await databases.listDocuments(
            DATABASE_ID!,
            ADMINISTRATORS_COLLECTION_ID!,
            [Query.equal("userId", user.$id)]
          );
          
          if (adminCheck.documents.length > 0) {
            // This is an admin trying to use the member login
            await account.deleteSession('current');
            toast.error('This account is registered as an administrator. Please use the admin login.');
            router.push('/admin-login');
            return;
          }
          
          // Not a member or admin
          await account.deleteSession('current');
          toast.error('This account does not have member access.');
          return;
        }
        
        // Continue with member login
        toast.success('Signed in successfully');
        
        // Force update the auth context with the latest user
        await checkAuth();
        
        // Get stored redirect path
        const storedRedirect = typeof window !== 'undefined' 
          ? sessionStorage.getItem('memberPortalRedirect') 
          : null;

        // Clear stored path
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('memberPortalRedirect');
        }

        // Use stored path or default
        if (storedRedirect) {
          router.push(storedRedirect);
        } else if (orgMemberCheck.documents.length > 0) {
          router.push(`/member-portal/${orgMemberCheck.documents[0].organizationId}`);
        } else {
          router.push('/member-portal');
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      console.error('Sign in error:', errorMessage);
      toast.error('Failed to sign in. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8">
            <Link href="/" className="text-[var(--stedi-teal)] text-2xl font-bold">
              securedpass
            </Link>
          </div>
          
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">Member Sign In</h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to access your membership portal
            </p>
          </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 sm:space-y-6"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter your email"
                      disabled={loading}
                      className="h-10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Enter your password"
                      disabled={loading}
                      className="h-10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full h-10 bg-[#1e293b]" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </Form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium text-[var(--stedi-teal)] hover:text-[var(--stedi-teal-dark)]">
                Register
              </Link>
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Looking for organization access?{" "}
              <Link href="/login" className="font-medium text-[var(--stedi-teal)] hover:text-[var(--stedi-teal-dark)]">
                Organization login
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Promotional content */}
      <div className="hidden lg:flex lg:flex-1 bg-[#1e293b] relative">
        {/* Geometric background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
            <defs>
              <pattern id="member-login-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#member-login-grid)" />
          </svg>
        </div>

        <div className="relative flex flex-col justify-center px-12 py-24 text-white">
          {/* Icon */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 border border-[var(--stedi-teal)] rounded-lg">
              <svg className="w-6 h-6 text-[var(--stedi-teal)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">
              Access Your Member Portal
            </h2>
            <p className="text-lg text-teal-100 mb-8 max-w-md">
              Check in to events, view your attendance history, and stay connected with your organization.
            </p>

            <div className="space-y-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-[var(--stedi-teal)]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                  </svg>
                </div>
                <p className="ml-3 text-teal-100">Quick QR code check-ins</p>
              </div>
              
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-[var(--stedi-teal)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-3 text-teal-100">View attendance history</p>
              </div>
              
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-[var(--stedi-teal)]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                </div>
                <p className="ml-3 text-teal-100">Stay connected with updates</p>
              </div>
            </div>
          </div>

          <div className="text-sm text-teal-200">
            Secure member access portal
          </div>
        </div>
      </div>
    </div>
  );
} 