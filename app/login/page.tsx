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
    <>
      <Header />
      <div className="flex min-h-screen flex-col">
        <div className="flex-1 container px-4 sm:px-6 max-w-md mx-auto py-6 sm:py-10">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold">Organization Login</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
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
                className="w-full mt-2"
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

          <div className="text-center mt-6 space-y-2">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Don&apos;t have an organization?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Create an organization
              </Link>
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Looking for member access?{" "}
              <Link href="/member-login" className="text-primary hover:underline">
                Member login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
} 