'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { databases, account, ID, Query, DATABASE_ID, REGISTRATION_CODES_COLLECTION_ID, ORGANIZATIONS_COLLECTION_ID, MEMBERS_COLLECTION_ID, ORGANIZATIONS_MEMBERS_COLLECTION_ID } from '@/lib/appwrite';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Add this interface near the top of the file, after the imports
interface Organization {
  $id: string;
  name: string;
  // Add other organization properties as needed
}

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

export default function OrganizationRegistrationPage() {
  const { code } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });
  
  useEffect(() => {
    const verifyRegistrationCode = async () => {
      try {
        setLoading(true);
        
        // Find the registration code
        const codeResponse = await databases.listDocuments(
          DATABASE_ID,
          REGISTRATION_CODES_COLLECTION_ID as string,
          [Query.equal('code', code as string)]
        );
        
        if (codeResponse.documents.length === 0) {
          toast.error('Invalid registration code');
          router.push('/');
          return;
        }
        
        const registrationCode = codeResponse.documents[0];
        
        // Get the organization details
        const org = await databases.getDocument(
          DATABASE_ID,
          ORGANIZATIONS_COLLECTION_ID as string,
          registrationCode.organizationId
        );
        
        setOrganization(org as unknown as Organization);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to verify registration code';
        console.error('Error verifying registration code:', errorMessage);
        toast.error('Invalid registration code');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    
    verifyRegistrationCode();
  }, [code, router]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setSubmitting(true);
      
      // Create user account
      const newUser = await account.create(
        ID.unique(),
        values.email,
        values.password,
        values.name
      );
      
      // Create organization member
      await databases.createDocument(
        DATABASE_ID,
        MEMBERS_COLLECTION_ID,
        ID.unique(),
        {
          userId: newUser.$id,
          organizationId: organization?.$id,
          name: values.name,
          email: values.email,
          status: 'active',
          createdAt: new Date().toISOString()
        }
      );
      
      // Create organization_members relationship
      await databases.createDocument(
        DATABASE_ID,
        ORGANIZATIONS_MEMBERS_COLLECTION_ID,
        ID.unique(),
        {
          userId: newUser.$id,
          organizationId: organization?.$id,
          role: 'member',
          createdAt: new Date().toISOString()
        }
      );
      
      // Log the user in
      await account.createEmailPasswordSession(values.email, values.password);
      
      toast.success('Registration successful!');
      router.push('/dashboard');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to register';
      console.error('Error during registration:', errorMessage);
      toast.error('Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Register for {organization?.name}</CardTitle>
          <CardDescription>
            Create your account to join this organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
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
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 