import { useState, useEffect, useCallback } from 'react';
import { databases, DATABASE_ID, ORGANIZATIONS_COLLECTION_ID, Query } from '@/lib/appwrite';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, CreditCard, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Organization } from '@/types';
import { useAuth } from '@/lib/auth-context';

interface CompanyPaymentInfoProps {
  organizationId: string;
  currentPlan?: 'free' | 'basic' | 'premium';
}

export default function CompanyPaymentInfo({ organizationId, currentPlan = 'free' }: CompanyPaymentInfoProps) {
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const { user } = useAuth();
  
  const fetchOrganizationDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await databases.getDocument(
        DATABASE_ID,
        ORGANIZATIONS_COLLECTION_ID,
        organizationId
      );
      
      setOrganization(response as unknown as Organization);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch organization details';
      console.error('Error fetching organization details:', errorMessage);
      toast.error('Failed to load organization information');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);
  
  useEffect(() => {
    fetchOrganizationDetails();
  }, [fetchOrganizationDetails]);
  
  const handleUpgrade = () => {
    // Open Stripe checkout for subscription upgrade
    window.location.href = `/api/checkout/session?organizationId=${organizationId}&plan=basic`;
  };
  
  const handleUpgradeToPremium = () => {
    window.location.href = `/api/checkout/session?organizationId=${organizationId}&plan=premium`;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Company Subscription Plan</CardTitle>
              <CardDescription>Your organization is on the {currentPlan.toUpperCase()} plan</CardDescription>
            </div>
            <Badge variant={currentPlan === 'premium' ? 'default' : currentPlan === 'basic' ? 'outline' : 'secondary'}>
              {currentPlan.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-blue-50 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Payment Model Information</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Company organizations use the <strong>Direct Subscription Model</strong>. Your organization pays a subscription 
                    fee to use the platform and all features are included in your plan.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2 border-gray-200">
                <CardHeader>
                  <CardTitle>Free</CardTitle>
                  <CardDescription>Limited access</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">$0</p>
                  <p className="text-sm text-muted-foreground">per month</p>
                  
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span>Up to 5 members</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span>Basic attendance tracking</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span>QR code check-in</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" disabled className="w-full">
                    Current Plan
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className={`border-2 ${currentPlan === 'basic' ? 'border-primary' : 'border-gray-200'}`}>
                <CardHeader>
                  <CardTitle>Basic</CardTitle>
                  <CardDescription>For small companies</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">$29</p>
                  <p className="text-sm text-muted-foreground">per month</p>
                  
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span>Up to 50 members</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span>Advanced attendance reporting</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span>Custom fields for check-in</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span>Email notifications</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  {currentPlan === 'basic' ? (
                    <Button variant="outline" disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : (
                    <Button onClick={handleUpgrade} className="w-full">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Upgrade to Basic
                    </Button>
                  )}
                </CardFooter>
              </Card>
              
              <Card className={`border-2 ${currentPlan === 'premium' ? 'border-primary' : 'border-gray-200'}`}>
                <CardHeader>
                  <CardTitle>Premium</CardTitle>
                  <CardDescription>For larger organizations</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">$99</p>
                  <p className="text-sm text-muted-foreground">per month</p>
                  
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span>Unlimited members</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span>Advanced analytics</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span>Priority support</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span>API access</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span>Data export</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  {currentPlan === 'premium' ? (
                    <Button variant="outline" disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : (
                    <Button onClick={handleUpgradeToPremium} className="w-full">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Upgrade to Premium
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {currentPlan !== 'free' && (
        <Card>
          <CardHeader>
            <CardTitle>Manage Subscription</CardTitle>
            <CardDescription>View or update your billing details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="outline">
                View billing portal
              </Button>
              
              <div className="text-sm text-muted-foreground">
                To cancel your subscription or update payment methods, visit the billing portal.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 