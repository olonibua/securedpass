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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { CustomField } from '@/types';

interface DynamicRegistrationFormProps {
  organizationId: string;
  customFields: CustomField[];
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

export default function DynamicRegistrationForm({ 
  organizationId, 
  customFields,
  onSubmit 
}: DynamicRegistrationFormProps) {
  const [submitting, setSubmitting] = useState(false);

  console.log("DynamicRegistrationForm received:", { organizationId, customFields });

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

  const formSchema = buildFormSchema();
  type FormValues = z.infer<typeof formSchema>;

  // Initialize form with default values
  const defaultValues = {
    name: '',
    email: '',
    password: '',
    ...customFields.reduce((acc, field) => {
      acc[field.$id] = '';
      return acc;
    }, {} as Record<string, string>)
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      
      // Extract basic fields and custom fields
      const { name, email, password, ...customFieldValues } = values;
      
      // Submit the form data
      await onSubmit({
        name,
        email,
        password,
        organizationId,
        customFieldValues
      });
      
      form.reset();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit form';
      console.error('Error submitting form:', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic fields that are always required */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter your full name" disabled={submitting} />
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
  );
} 