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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { account, DATABASE_ID, MEMBERS_COLLECTION_ID, ORGANIZATIONS_MEMBERS_COLLECTION_ID, databases } from '@/lib/appwrite';
import { toast } from 'sonner';
import { Query } from 'appwrite';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        if (memberCheck.documents.length === 0 && orgMemberCheck.documents.length === 0) {
          // Sign them out
          await account.deleteSession('current');
          toast.error('This account does not have member access. Please use the admin login.');
          return;
        }
        
        // Continue with member login
        toast.success('Signed in successfully');
        
        // If we found an organization member record, redirect to that organization
        if (orgMemberCheck.documents.length > 0) {
          router.push(`/member-portal/${orgMemberCheck.documents[0].organizationId}`);
        } else {
          // Otherwise go to member portal dashboard
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
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Sign in to access your membership portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              
              
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 