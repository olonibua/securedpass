'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
import Header from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  // User information
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  confirmPassword: z.string(),
  
  // Organization information
  organizationName: z.string().min(2, {
    message: "Organization name must be at least 2 characters.",
  }),
  industry: z.string().optional(),
  size: z.string().optional(),
  plan: z.enum(["free", "basic", "premium"], {
    message: "Please select a valid plan.",
  }),
  organizationType: z.enum(["company", "membership"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("account");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      organizationName: "",
      industry: "",
      size: "",
      plan: "free",
      organizationType: "company",
    },
  });

  // Function to check if account fields are valid with feedback
  const isAccountFormValid = () => {
    const { name, email, password, confirmPassword } = form.getValues();
    
    // Check each field and provide specific feedback
    if (!name || name.length < 2) {
      return false;
    }
    
    if (!email || !email.match(/^\S+@\S+\.\S+$/)) {
      return false;
    }
    
    if (!password || password.length < 8) {
      return false;
    }
    
    if (password !== confirmPassword) {
      return false;
    }
    
    return true;
  };

  const handleNextTab = () => {
    // Validate with detailed feedback
    const { name, email, password, confirmPassword } = form.getValues();
    
    if (!name || name.length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    
    if (!email || !email.match(/^\S+@\S+\.\S+$/)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    if (!password || password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    
    // If we get here, all validations passed
    setActiveTab("organization");
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Call API to create organization and admin user
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          organizationName: values.organizationName,
          industry: values.industry,
          size: values.size,
          plan: values.plan,
          organizationType: values.organizationType,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.details || 'Failed to create organization');
      }
      
      toast.success('Organization created successfully!');
      
      // If plan is not free, redirect to payment
      if (values.plan !== 'free') {
        router.push(`/payment?plan=${values.plan}&organizationId=${data.organization.id}`);
      } else {
        // Redirect to dashboard since user is already logged in
        router.push('/dashboard');
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create organization';
      console.error("Error during registration:", errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <div className="flex-1 container max-w-md mx-auto py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Create Your Organization</h1>
          <p className="text-muted-foreground mt-2">
            Set up your organization and admin account
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="account">Your Account</TabsTrigger>
                <TabsTrigger value="organization">Organization</TabsTrigger>
              </TabsList>

              <TabsContent value="account" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your name" {...field} />
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
                          placeholder="Create a password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm your password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  className="w-full mt-6"
                  onClick={handleNextTab}
                  disabled={!isAccountFormValid()}
                >
                  Next: Organization Details
                </Button>
              </TabsContent>

              <TabsContent value="organization" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter organization name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="nonprofit">Non-profit</SelectItem>
                          <SelectItem value="events">Events</SelectItem>
                          <SelectItem value="religious">Religious</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Size</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 members</SelectItem>
                          <SelectItem value="11-50">11-50 members</SelectItem>
                          <SelectItem value="51-200">51-200 members</SelectItem>
                          <SelectItem value="201-1000">
                            201-1000 members
                          </SelectItem>
                          <SelectItem value="1000+">1000+ members</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subscription Plan</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="free">
                            Free (Limited to 50 check-ins/month)
                          </SelectItem>
                          <SelectItem value="basic">
                            Basic - $9.99/month (500 check-ins)
                          </SelectItem>
                          <SelectItem value="premium">
                            Premium - $29.99/month (Unlimited)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        You can upgrade your plan anytime.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organizationType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Organization Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="company" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Company
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="membership" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Membership Organization
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-1/2"
                    onClick={() => setActiveTab("account")}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="w-1/2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Organization"
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </Form>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 