'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { databases, account, ID, Query, DATABASE_ID, REGISTRATION_CODES_COLLECTION_ID, ORGANIZATIONS_COLLECTION_ID, MEMBERS_COLLECTION_ID, ORGANIZATIONS_MEMBERS_COLLECTION_ID, CUSTOMFIELDS_COLLECTION_ID } from '@/lib/appwrite';
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomField } from '@/types';

// Complete the interface definition
interface Organization {
  $id: string;
  name: string;
  type?: string;
}

export default function OrganizationRegistrationPage() {
  const { code } = useParams();
  const router = useRouter();
  
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch registration code
        const codeResponse = await databases.listDocuments(
          DATABASE_ID,
          REGISTRATION_CODES_COLLECTION_ID as string,
          [Query.equal('code', Array.isArray(code) ? code[0] : (code || ''))]
        );
        
        if (codeResponse.documents.length === 0) {
          throw new Error('Invalid registration code');
        }
        
        const organizationId = codeResponse.documents[0].organizationId;
        
        // Fetch organization details
        const orgResponse = await databases.getDocument(
          DATABASE_ID,
          ORGANIZATIONS_COLLECTION_ID,
          organizationId
        );
        
        setOrganization(orgResponse as unknown as Organization);
        
        // Log details about what we're about to query
       
        
        // Use exactly the same query pattern that works in CustomFieldsManager
        const fieldsResponse = await databases.listDocuments(
          DATABASE_ID,
          CUSTOMFIELDS_COLLECTION_ID,
          [
            Query.equal('organizationId', organizationId),
            Query.orderAsc('order')
          ]
        );
        
        
        // Set the custom fields
        setCustomFields(fieldsResponse.documents as unknown as CustomField[]);
        
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load registration page';
        console.error('REGISTER PAGE - Error:', errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [code, router]);
  
  // Build the form schema based on custom fields
  const buildFormSchema = () => {
    const schemaMap: Record<string, z.ZodTypeAny> = {
      // Always include name and email fields
      name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
      email: z.string().email({ message: 'Invalid email address' }),
      password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
    };
    
    // Add custom fields to schema
    customFields.forEach(field => {
      let validator: z.ZodTypeAny;
      
      switch (field.type) {
        case 'email':
          validator = z.string().email({ message: 'Invalid email address' });
          break;
        case 'number':
          validator = z.string().refine(val => !isNaN(Number(val)), {
            message: 'Must be a valid number',
          });
          break;
        case 'phone':
          validator = z.string().min(5, { message: 'Phone number is too short' });
          break;
        case 'date':
          validator = z.string().refine(val => !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
          });
          break;
        case 'select':
          validator = z.string().min(1, { message: 'Please select an option' });
          break;
        default:
          validator = z.string();
      }
      
      if (field.required) {
        if (validator instanceof z.ZodString) {
          validator = validator.min(1, { message: 'This field is required' });
        } else {
          validator = z.string().min(1, { message: 'This field is required' });
        }
      } else {
        validator = validator.optional();
      }
      
      schemaMap[field.$id] = validator;
    });
    
    return z.object(schemaMap);
  };

  const form = useForm<z.infer<ReturnType<typeof buildFormSchema>>>({
    resolver: zodResolver(buildFormSchema()),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      setSubmitting(true);
      
      // Extract custom field data
      const customFieldsData: Record<string, unknown> = {};
      customFields.forEach(field => {
        customFieldsData[field.$id] = data[field.$id];
      });
      
      // Create user
      const newUser = await account.create(
        ID.unique(),
        data.email as string,
        data.password as string,
        data.name as string
      );
      
      // Create member
      await databases.createDocument(
        DATABASE_ID,
        MEMBERS_COLLECTION_ID,
        ID.unique(),
        {
          userId: newUser.$id,
          organizationId: organization?.$id,
          name: data.name as string,
          email: data.email as string,
          status: 'active',
          createdAt: new Date().toISOString(),
          customFields: JSON.stringify(customFieldsData)
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
      
      toast.success('Registration successful! Please log in with your credentials.');
      router.push('/member-login');
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
      <div className="container max-w-md mx-auto py-10">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full mb-2" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!organization) {
    return (
      <div className="container max-w-md mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-destructive">Invalid Registration Link</CardTitle>
            <CardDescription className="text-center">
              This registration link is invalid or has expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Register for {organization.name}</CardTitle>
          <CardDescription>
            Create your account to join this organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your name" disabled={submitting} />
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
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="Enter your email" disabled={submitting} />
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
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Create a password" disabled={submitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Dynamic custom fields */}
              {customFields.map((field) => (
                <FormField
                  key={field.$id}
                  control={form.control}
                  name={field.$id}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>
                        {field.name}
                        {field.required && ' *'}
                      </FormLabel>
                      <FormControl>
                        {field.type === 'select' ? (
                          <Select
                            onValueChange={formField.onChange}
                            defaultValue={formField.value}
                            disabled={submitting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={field.placeholder || `Select ${field.name}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : field.type === 'date' ? (
                          <Input
                            {...formField}
                            type="date"
                            placeholder={field.placeholder}
                            disabled={submitting}
                          />
                        ) : (
                          <Input
                            {...formField}
                            type={
                              field.type === 'email' ? 'email' :
                              field.type === 'number' ? 'number' :
                              field.type === 'phone' ? 'tel' : 'text'
                            }
                            placeholder={field.placeholder || `Enter ${field.name}`}
                            disabled={submitting}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              
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