'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Trash, Edit } from 'lucide-react';
import { DATABASE_ID, MEMBERSHIP_PLANS_COLLECTION_ID, databases, ID, Query } from '@/lib/appwrite';
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
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface MembershipPlanManagerProps {
  organizationId: string;
}

const planFormSchema = z.object({
  name: z.string().min(2, { message: "Plan name must be at least 2 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  price: z.coerce.number().min(0, { message: "Price must be a positive number" }),
  interval: z.enum(["monthly", "yearly", "one-time"]),
  isActive: z.boolean().default(true),
  features: z.string().optional(),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

export default function MembershipPlanManager({ organizationId }: MembershipPlanManagerProps) {
  const [plans, setPlans] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      interval: 'monthly',
      isActive: true,
      features: '',
    },
  });

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      
      // Make sure we have the collection ID
      if (!MEMBERSHIP_PLANS_COLLECTION_ID) {
        throw new Error("Membership plans collection ID is not defined");
      }
      
      console.log("Fetching membership plans for org:", organizationId);
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        MEMBERSHIP_PLANS_COLLECTION_ID,
        [
          Query.equal('organizationId', organizationId),
          Query.orderAsc('price')
        ]
      );
      
      console.log("Received plans:", response.documents.length);
      setPlans(response.documents);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch membership plans';
      console.error('Error fetching membership plans:', errorMessage);
      toast.error('Failed to load membership plans');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleCreatePlan = async (values: PlanFormValues) => {
    try {
      const featuresArray = values.features 
        ? values.features.split('\n').filter(feature => feature.trim() !== '')
        : [];
      
      await databases.createDocument(
        DATABASE_ID,
        MEMBERSHIP_PLANS_COLLECTION_ID as string,
        ID.unique(),
        {
          organizationId,
          name: values.name,
          description: values.description,
          price: values.price,
          interval: values.interval,
          isActive: values.isActive,
          features: featuresArray,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      
      toast.success('Membership plan created successfully');
      form.reset();
      setIsDialogOpen(false);
      fetchPlans();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create plan';
      console.error('Error creating membership plan:', errorMessage);
      toast.error('Failed to create membership plan');
    }
  };

  const handleUpdatePlan = async (planId: string, values: PlanFormValues) => {
    try {
      const featuresArray = values.features 
        ? values.features.split('\n').filter(feature => feature.trim() !== '')
        : [];
      
      await databases.updateDocument(
        DATABASE_ID,
        MEMBERSHIP_PLANS_COLLECTION_ID as string,
        planId,
        {
          name: values.name,
          description: values.description,
          price: values.price,
          interval: values.interval,
          isActive: values.isActive,
          features: featuresArray,
          updatedAt: new Date().toISOString(),
        }
      );
      
      toast.success('Membership plan updated successfully');
      setEditingPlan(null);
      fetchPlans();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update plan';
      console.error('Error updating membership plan:', errorMessage);
      toast.error('Failed to update membership plan');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        MEMBERSHIP_PLANS_COLLECTION_ID as string,
        planId
      );
      
      toast.success('Membership plan deleted successfully');
      fetchPlans();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete plan';
      console.error('Error deleting membership plan:', errorMessage);
      toast.error('Failed to delete membership plan');
    }
  };

  const startEditing = (plan: Record<string, unknown>) => {
    setEditingPlan(plan.$id as string);
    form.reset({
      name: plan.name as string,
      description: plan.description as string,
      price: plan.price as number,
      interval: plan.interval as "monthly" | "yearly" | "one-time",
      isActive: plan.isActive as boolean,
      features: (plan.features as string[]).join('\n'),
    });
  };

  const formatPrice = (price: number, interval: string) => {
    if (interval === 'one-time') {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toFixed(2)}/${interval === 'monthly' ? 'mo' : 'yr'}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Membership Plans</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Membership Plan</DialogTitle>
              <DialogDescription>
                Create a new membership plan for your organization members.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreatePlan)} className="space-y-4">
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
                        <Textarea 
                          placeholder="Describe what's included in this plan" 
                          {...field} 
                          rows={3}
                        />
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
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                            <option value="one-time">One-time Payment</option>
                          </select>
                        </FormControl>
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
                      <FormLabel>Features (one per line)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Access to gym facilities&#10;Free towel service&#10;Locker access" 
                          {...field} 
                          rows={4}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter each feature on a new line
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
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
                
                <DialogFooter>
                  <Button type="submit">Create Plan</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center p-12 border rounded-lg">
          <p className="text-muted-foreground">No membership plans created yet.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => { setIsDialogOpen(true); setEditingPlan(null); }}
          >
            Create your first plan
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.$id as string} className={!plan.isActive ? "opacity-70" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{plan.name as string}</CardTitle>
                    <CardDescription className="mt-1">
                      {formatPrice(plan.price as number, plan.interval as string)}
                    </CardDescription>
                  </div>
                  {!plan.isActive && (
                    <Badge variant="outline" className="text-muted-foreground">
                      Inactive
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{plan.description as string}</p>
                {(plan.features as string[]).length > 0 && (
                  <ul className="space-y-2">
                    {(plan.features as string[]).map((feature: string, index: number) => (
                      <li key={index} className="text-sm flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDeletePlan(plan.$id as string)}
                >
                  <Trash className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => startEditing(plan)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {editingPlan && (
        <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Membership Plan</DialogTitle>
              <DialogDescription>
                Update the details of this membership plan.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((values) => handleUpdatePlan(editingPlan, values))} className="space-y-4">
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
                        <Textarea 
                          placeholder="Describe what's included in this plan" 
                          {...field} 
                          rows={3}
                        />
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
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                            <option value="one-time">One-time Payment</option>
                          </select>
                        </FormControl>
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
                      <FormLabel>Features (one per line)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Access to gym facilities&#10;Free towel service&#10;Locker access" 
                          {...field} 
                          rows={4}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter each feature on a new line
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
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
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingPlan(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 