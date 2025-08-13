'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { account, databases, DATABASE_ID, ADMINISTRATORS_COLLECTION_ID, ORGANIZATIONS_COLLECTION_ID, ORGANIZATIONS_MEMBERS_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { toast } from 'sonner';

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function UnifiedOrgLoginPage() {
  const { checkAuth } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
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
        // Check if user is an organization owner
        const orgOwnerCheck = await databases.listDocuments(
          DATABASE_ID,
          ORGANIZATIONS_COLLECTION_ID,
          [Query.equal("ownerId", user.$id)]
        );

        // Check if user is an administrator
        const adminCheck = await databases.listDocuments(
          DATABASE_ID,
          ADMINISTRATORS_COLLECTION_ID,
          [Query.equal("userId", user.$id)]
        );
        
        // Check if user is an org member with admin/manager/viewer role
        const orgAdminCheck = await databases.listDocuments(
          DATABASE_ID,
          ORGANIZATIONS_MEMBERS_COLLECTION_ID,
          [
            Query.equal("userId", user.$id),
            Query.equal("role", "admin")
          ]
        );
        
        const orgManagerCheck = await databases.listDocuments(
          DATABASE_ID,
          ORGANIZATIONS_MEMBERS_COLLECTION_ID,
          [
            Query.equal("userId", user.$id),
            Query.equal("role", "manager")
          ]
        );
        
        const orgViewerCheck = await databases.listDocuments(
          DATABASE_ID,
          ORGANIZATIONS_MEMBERS_COLLECTION_ID,
          [
            Query.equal("userId", user.$id),
            Query.equal("role", "viewer")
          ]
        );
        
        // If no org or admin records found, this user has no admin access
        if (orgOwnerCheck.documents.length === 0 &&
            adminCheck.documents.length === 0 &&
            orgAdminCheck.documents.length === 0 && 
            orgManagerCheck.documents.length === 0 &&
            orgViewerCheck.documents.length === 0) {
          // Sign them out
          await account.deleteSession('current');
          toast.error('This account does not have organization or admin access. Please use the member login if you are a member.');
          router.push('/member-login');
          return;
        }
        
        // Update the admin's last login time if they're an admin
        if (adminCheck.documents.length > 0) {
          const admin = adminCheck.documents[0];
          await databases.updateDocument(
            DATABASE_ID,
            ADMINISTRATORS_COLLECTION_ID,
            admin.$id,
            {
              lastLogin: new Date().toISOString()
            }
          );
        }
        
        // Login successful
        toast.success('Signed in successfully');
        
        // Force update the auth context
        await checkAuth();
        
        // Determine where to redirect based on user's role
        if (orgOwnerCheck.documents.length > 0) {
          // Org owner - redirect to their org
          router.push(`/dashboard/${orgOwnerCheck.documents[0].$id}`);
        } else if (orgAdminCheck.documents.length > 0) {
          // Org admin - redirect to their org
          router.push(`/dashboard/${orgAdminCheck.documents[0].organizationId}`);
        } else if (orgManagerCheck.documents.length > 0) {
          // Org manager - redirect to their org
          router.push(`/dashboard/${orgManagerCheck.documents[0].organizationId}`);
        } else if (orgViewerCheck.documents.length > 0) {
          // Org viewer - redirect to their org
          router.push(`/dashboard/${orgViewerCheck.documents[0].organizationId}`);
        } else {
          // Fallback - go to dashboard selection
          router.push('/dashboard');
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      console.error('Login error:', errorMessage);
      toast.error('Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
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
            <h1 className="text-2xl font-semibold text-gray-900">Organization Login</h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to manage your organization
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
                        type="email"
                        placeholder="Enter your email"
                        {...field}
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
                        type="password"
                        placeholder="Enter your password"
                        {...field}
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

              <Button
                type="submit"
                className="w-full mt-2 bg-[#1e293b]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Log in"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-8 space-y-4 text-center">
            <p className="text-sm text-gray-600">
              Don't have an organization?{" "}
              <Link href="/register" className="font-medium text-[var(--stedi-teal)] hover:text-[var(--stedi-teal-dark)]">
                Create an organization
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Looking for member access?{" "}
              <Link href="/member-login" className="font-medium text-[var(--stedi-teal)] hover:text-[var(--stedi-teal-dark)]">
                Member login
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
              <pattern id="login-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#login-grid)" />
          </svg>
        </div>

        <div className="relative flex flex-col justify-center px-12 py-24 text-white">
          {/* Icon */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 border border-[var(--stedi-teal)] rounded-lg">
              <svg className="w-6 h-6 text-[var(--stedi-teal)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">
              Welcome Back
            </h2>
            <p className="text-lg text-teal-100 mb-8 max-w-md">
              Access your organization dashboard to manage attendance, view reports, and oversee your team's check-ins.
            </p>

            <div className="space-y-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-[var(--stedi-teal)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-3 text-teal-100">Comprehensive attendance dashboard</p>
              </div>
              
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-[var(--stedi-teal)]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12a3 3 0 006 0 3 3 0 00-6 0z" />
                    <path fillRule="evenodd" d="M10 2C5.582 2 2 5.582 2 10s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zM6 10a4 4 0 108 0 4 4 0 00-8 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="ml-3 text-teal-100">Member management tools</p>
              </div>
              
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-[var(--stedi-teal)]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                  </svg>
                </div>
                <p className="ml-3 text-teal-100">QR code generation and management</p>
              </div>
            </div>
          </div>

          <div className="text-sm text-teal-200">
            Trusted by organizations worldwide
          </div>
        </div>
      </div>
    </div>
  );
} 