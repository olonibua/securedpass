'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { DATABASE_ID, MEMBERSHIP_PLANS_COLLECTION_ID, databases, ID } from '@/lib/appwrite';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
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
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Add this interface for the plan data shape
interface MembershipPlanData {
  organizationId: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  isActive: boolean;
  features: string[];
  createdAt: string;
  updatedAt: string;
  $id?: string;
}

interface MembershipPlanFormProps {
  organizationId: string;
  onSubmit: (plan: MembershipPlanData) => Promise<void>;
  onCancel: () => void;
  existingPlan?: MembershipPlanData;
}

const planFormSchema = z.object({
  name: z.string().min(2, { message: "Plan name must be at least 2 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  price: z.coerce.number().min(0, { message: "Price must be a positive number" }),
  interval: z.enum(["monthly", "yearly", "one-time"]),
  isActive: z.boolean().default(true),
  features: z.string().optional(),
});

export default function MembershipPlanForm({ organizationId, onSubmit, onCancel, existingPlan }: MembershipPlanFormProps) {
  const [submitting, setSubmitting] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(planFormSchema),
    defaultValues: existingPlan ? {
      name: existingPlan.name,
      description: existingPlan.description,
      price: existingPlan.price / 100, // Convert from cents to dollars for display
      interval: existingPlan.interval as 'monthly' | 'yearly' | 'one-time',
      isActive: existingPlan.isActive,
      features: Array.isArray(existingPlan.features) ? existingPlan.features.join('\n') : existingPlan.features || '',
    } : {
      name: '',
      description: '',
      price: 0,
      interval: 'monthly',
      isActive: true,
      features: '',
    }
  });

  const handleSubmit = async (values: z.infer<typeof planFormSchema>) => {
    try {
      setSubmitting(true);
      
      // Parse features into an array
      const featuresArray = values.features 
        ? values.features.split('\n').map(f => f.trim()).filter(f => f.length > 0)
        : [];
      
      // Convert price to cents for storage
      const priceInCents = Math.round(values.price * 100);
      
      const planData = {
        organizationId,
        name: values.name,
        description: values.description,
        price: priceInCents,
        interval: values.interval,
        isActive: values.isActive,
        features: featuresArray,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      if (existingPlan && existingPlan.$id) {
        // Update existing plan
        await databases.updateDocument(
          DATABASE_ID,
          MEMBERSHIP_PLANS_COLLECTION_ID as string,
          existingPlan.$id,
          planData
        );
      } else {
        // Create new plan
        await databases.createDocument(
          DATABASE_ID,
          MEMBERSHIP_PLANS_COLLECTION_ID as string,
          ID.unique(),
          planData
        );
      }
      
      await onSubmit(planData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save plan';
      console.error('Error saving membership plan:', errorMessage);
      toast.error('Failed to save plan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingPlan ? 'Edit' : 'Create'} Membership Plan</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Basic Membership" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the benefits of this plan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>Enter price in dollars</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="interval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Interval</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select billing interval" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="one-time">One-time</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="features"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Features</FormLabel>
                  <FormControl>
                    <Textarea placeholder="One feature per line" {...field} rows={5} />
                  </FormControl>
                  <FormDescription>Enter one feature per line</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      Make this plan available to members
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={form.handleSubmit(handleSubmit)} 
          disabled={submitting}
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existingPlan ? 'Update' : 'Create'} Plan
        </Button>
      </CardFooter>
    </Card>
  );
} 