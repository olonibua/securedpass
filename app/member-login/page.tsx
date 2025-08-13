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
import Header from '@/components/layout/Header';
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
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1 container max-w-md mx-auto px-4 py-24 sm:py-28  md:py-40">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold">Member Sign In</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
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

            <Button type="submit" className="w-full h-10" disabled={loading}>
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

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 