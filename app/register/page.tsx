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

 

  const handleNextTab = () => {
    // Get form values
    const { name, email, password, confirmPassword } = form.getValues();
    
    // Validate each field and show appropriate errors with toast notifications
    let hasError = false;
    let errorMessage = "";
    
    if (!name || name.length < 2) {
      form.setError('name', { message: 'Name must be at least 2 characters' });
      hasError = true;
      errorMessage = "Name must be at least 2 characters";
    }
    else if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      form.setError('email', { message: 'Please enter a valid email address' });
      hasError = true;
      errorMessage = "Please enter a valid email address";
    }
    else if (!password || password.length < 8) {
      form.setError('password', { message: 'Password must be at least 8 characters' });
      hasError = true;
      errorMessage = "Password must be at least 8 characters";
    }
    else if (password !== confirmPassword) {
      form.setError('confirmPassword', { message: "Passwords don't match" });
      hasError = true;
      errorMessage = "Passwords don't match";
    }
    
    // If errors, show toast and don't proceed
    if (hasError) {
      toast.error(errorMessage || "Please complete all required fields correctly");
      return;
    }
    
    // If no errors, proceed to next tab
    setActiveTab("organization");
    toast.success("Account details saved successfully");
  };

 

  // Add a function to handle the validation when submitting the organization form
  const handleSubmitValidation = () => {
    const { organizationName, plan, organizationType } = form.getValues();
    let hasError = false;
    let errorMessage = "";
    
    if (!organizationName || organizationName.length < 2) {
      form.setError('organizationName', { message: 'Organization name must be at least 2 characters' });
      hasError = true;
      errorMessage = "Organization name must be at least 2 characters";
    }
    else if (!plan) {
      form.setError('plan', { message: 'Please select a subscription plan' });
      hasError = true;
      errorMessage = "Please select a subscription plan";
    }
    else if (!organizationType) {
      form.setError('organizationType', { message: 'Please select an organization type' });
      hasError = true;
      errorMessage = "Please select an organization type";
    }
    
    if (hasError) {
      toast.error(errorMessage || "Please complete all required organization details");
      return false;
    }
    
    return true;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // First validate before proceeding
    if (!handleSubmitValidation()) {
      return;
    }
    
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

  // Add this function to handle tab changes with validation
  const handleTabChange = (value: string) => {
    // Only perform validation when trying to switch to organization tab
    if (value === "organization") {
      // Check if account information is valid
      const { name, email, password, confirmPassword } = form.getValues();
      
      let hasError = false;
      let errorMessage = "";
      
      if (!name || name.length < 2) {
        form.setError('name', { message: 'Name must be at least 2 characters' });
        hasError = true;
        errorMessage = "Name must be at least 2 characters";
      }
      else if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        form.setError('email', { message: 'Please enter a valid email address' });
        hasError = true;
        errorMessage = "Please enter a valid email address";
      }
      else if (!password || password.length < 8) {
        form.setError('password', { message: 'Password must be at least 8 characters' });
        hasError = true;
        errorMessage = "Password must be at least 8 characters";
      }
      else if (password !== confirmPassword) {
        form.setError('confirmPassword', { message: "Passwords don't match" });
        hasError = true;
        errorMessage = "Passwords don't match";
      }
      
      if (hasError) {
        toast.error(errorMessage || "Please complete all required fields correctly");
        return; // Don't change tabs
      }
      
      // If validation passes, show success and allow tab change
      toast.success("Account details saved successfully");
    }
    
    // Set the active tab if validation passed or going back to account tab
    setActiveTab(value);
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8">
            <Link href="/" className="text-[var(--stedi-teal)] text-2xl font-bold">
              securedpass
            </Link>
          </div>
          
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">Create Your Organization</h1>
            <p className="mt-2 text-sm text-gray-600">
              Set up your organization and admin account
            </p>
          </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
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
                        <Input placeholder="Enter your name" {...field} className="text-sm sm:text-base h-10" />
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
                          className="text-sm sm:text-base h-10"
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
                          className="text-sm sm:text-base h-10"
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
                          className="text-sm sm:text-base h-10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  className="w-full h-10 mt-6 bg-[#1e293b]"
                  onClick={handleNextTab}
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
                          className="text-sm sm:text-base h-10"
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
                          <SelectTrigger className="text-sm sm:text-base h-10">
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
                          <SelectTrigger className="text-sm sm:text-base h-10">
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
                          <SelectTrigger className="text-sm sm:text-base h-10">
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
                    className="w-1/2 text-sm sm:text-base h-10"
                    onClick={() => setActiveTab("account")}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="w-1/2 h-10 bg-[#1e293b]"
                    onClick={() => {
                      if (handleSubmitValidation()) {
                        form.handleSubmit(onSubmit)();
                      }
                    }}
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

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-[var(--stedi-teal)] hover:text-[var(--stedi-teal-dark)]">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Promotional content */}
      <div className="hidden lg:flex lg:flex-1 bg-[#1e293b] relative">
        {/* Geometric background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
            <defs>
              <pattern id="register-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#register-grid)" />
          </svg>
        </div>

        <div className="relative flex flex-col justify-center px-12 py-24 text-white">
          {/* Icon */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 border border-[var(--stedi-teal)] rounded-lg">
              <svg className="w-6 h-6 text-[var(--stedi-teal)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-9a2 2 0 00-2-2H6a2 2 0 00-2 2v9a2 2 0 002 2zm10-12V6a2 2 0 00-2-2H8a2 2 0 00-2 2v3h8z" />
              </svg>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">
              Transform Your Check-in Experience
            </h2>
            <p className="text-lg text-teal-100 mb-8 max-w-md">
              Join thousands of organizations using SecuredPass to streamline attendance tracking and member management.
            </p>

            <div className="space-y-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-[var(--stedi-teal)]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                  </svg>
                </div>
                <p className="ml-3 text-teal-100">QR-based attendance tracking</p>
              </div>
              
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-[var(--stedi-teal)]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                  </svg>
                </div>
                <p className="ml-3 text-teal-100">Real-time analytics and reporting</p>
              </div>
              
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-[var(--stedi-teal)]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                  </svg>
                </div>
                <p className="ml-3 text-teal-100">Custom forms and data collection</p>
              </div>
            </div>
          </div>

          <div className="text-sm text-teal-200">
            Free plan includes 50 check-ins per month
          </div>
        </div>
      </div>
    </div>
  );
} 