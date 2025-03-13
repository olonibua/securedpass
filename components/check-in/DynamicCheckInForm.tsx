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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { DATABASE_ID, CUSTOMFIELDS_COLLECTION_ID, databases, Query } from '@/lib/appwrite';
import { toast } from 'sonner';
import { CustomField } from '@/types';

interface DynamicCheckInFormProps {
  organizationId: string;
  onSubmit: (data: Record<string, any>) => Promise<void>;
}

export default function DynamicCheckInForm({ 
  organizationId, 
  onSubmit 
}: DynamicCheckInFormProps) {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch custom fields on component mount
  useEffect(() => {
    const fetchCustomFields = async () => {
      try {
        setLoading(true);
        const response = await databases.listDocuments(
          DATABASE_ID!,
          CUSTOMFIELDS_COLLECTION_ID!,
          [
            Query.equal('organizationId', organizationId),
            Query.orderAsc('order')
          ]
        );
        
        setCustomFields(response.documents as unknown as CustomField[]);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch custom fields';
        console.error('Error fetching custom fields:', errorMessage);
        toast.error('Failed to load check-in form');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomFields();
  }, [organizationId]);

  // Dynamically build the form schema based on custom fields
  const buildFormSchema = () => {
    const schemaMap: Record<string, any> = {};
    
    customFields.forEach(field => {
      let validator;
      
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
        if ('min' in validator) {
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

  const formSchema = buildFormSchema();
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: customFields.reduce((acc, field) => {
      acc[field.$id] = '';
      return acc;
    }, {} as Record<string, string>),
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      await onSubmit(values);
      form.reset();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit check-in';
      console.error('Error submitting check-in:', errorMessage);
      toast.error('Failed to submit check-in');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (customFields.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No check-in fields have been configured for this organization.</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {customFields.map((field) => (
          <FormField
            key={field.$id}
            control={form.control}
            name={field.$id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.name}{field.required && ' *'}</FormLabel>
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
                      placeholder={field.placeholder}
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
              Checking in...
            </>
          ) : (
            'Check In'
          )}
        </Button>
      </form>
    </Form>
  );
}
