'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { databases } from '@/lib/appwrite';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, Calendar, Settings, QrCode, CreditCard } from 'lucide-react';
import { Organization } from '@/types';
import AttendanceTable from '@/components/dashboard/AttendanceTable';
import QRCodeDisplay from '@/components/admin/QRCodeDisplay';
import CustomFieldsManager from '@/components/admin/CustomFieldsManager';
import RegistrationLinkGenerator from '@/components/admin/RegistrationLinkGenerator';
import { Badge } from '@/components/ui/badge';
import { DATABASE_ID, ORGANIZATIONS_COLLECTION_ID } from '@/lib/appwrite';
import CompanyMemberManager from '@/components/admin/CompanyMemberManager';
import MembershipManager from '@/components/admin/MembershipManager';
import MembershipPlanManager from '@/components/admin/MembershipPlanManager';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

export default function OrganizationDashboard() {
  const { organizationId } = useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user, isLoaded: authLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only fetch once auth is loaded and we have an organizationId
    if (!authLoaded) return;
    if (!organizationId) return;

    const fetchOrganization = async () => {
      try {
        setLoading(true);
        setError(null);

        const org = await databases.getDocument(
          DATABASE_ID,
          ORGANIZATIONS_COLLECTION_ID,
          organizationId as string
        );
        setOrganization(org as unknown as Organization);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load organization";
        console.error("Error fetching organization:", errorMessage);
        setError(errorMessage);
        toast.error("Failed to load organization");
        // Redirect to dashboard on error (optional)
        // router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [organizationId, authLoaded, router]);

  if (!authLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium mb-2">Organization not found</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              {error ||
                "The organization you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it."}
            </p>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isMembershipOrg = organization.organizationType === "membership";
  const isCompanyOrg = organization.organizationType === "company";

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {organization.name}
          </h1>
          <p className="text-muted-foreground">
            Manage your organization&apos;s members and settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={organization.plan === "free" ? "outline" : "default"}>
            {organization.plan.charAt(0).toUpperCase() +
              organization.plan.slice(1)}{" "}
            Plan
          </Badge>
          <Badge variant="secondary">
            {organization.organizationType === "membership"
              ? "Membership Organization"
              : "Company"}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="members">
        <TabsList className="mb-4">
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>

          <TabsTrigger value="attendance">
            <Calendar className="h-4 w-4 mr-2" />
            Attendance
          </TabsTrigger>

          <TabsTrigger value="check-in">
            <QrCode className="h-4 w-4 mr-2" />
            Check-in
          </TabsTrigger>

          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>

          <TabsTrigger value="membership-plans">
            <CreditCard className="h-4 w-4 mr-2" />
            Membership Plans
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          {isCompanyOrg ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Company Members</span>
                </CardTitle>
                <CardDescription>
                  Manage members of your company organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CompanyMemberManager
                  organizationId={organizationId as string}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Membership Organization</CardTitle>
                <CardDescription>
                  Manage members who have joined your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MembershipManager organizationId={organizationId as string} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                View check-in history for your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceTable organizationId={organizationId as string} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="check-in" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>QR Code Check-in</CardTitle>
              <CardDescription>
                Display this QR code at your entrance for easy check-ins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QRCodeDisplay organizationId={organizationId as string} />
            </CardContent>
          </Card>

          {isMembershipOrg && (
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Member Registration</CardTitle>
                  <CardDescription>
                    Share this registration link with people to join your
                    organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RegistrationLinkGenerator
                    organizationId={organizationId as string}
                    organizationName={organization.name}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <div className="flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Custom Fields</CardTitle>
                <CardDescription>
                  Configure custom fields for member registration and check-ins
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomFieldsManager
                  organizationId={organizationId as string}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>
                  Manage your organization&apos;s subscription plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* <SubscriptionManager
                  organizationId={organizationId as string}
                  currentPlan={organization.plan}
                /> */}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="membership-plans">
          <Card>
            <CardHeader>
              <CardTitle>Membership Plans</CardTitle>
              <CardDescription>
                Create and manage membership plans for your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MembershipPlanManager
                organizationId={organizationId as string}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 