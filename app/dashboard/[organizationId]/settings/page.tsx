'use client';

import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SubscriptionPauseSettings from '@/components/organization/SubscriptionPauseSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const { organizationId } = useParams();
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <p className="text-muted-foreground mb-6">
        Manage your organization settings
      </p>

      <Tabs defaultValue="organization" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
              <CardDescription>
                Update your organization&apos;s basic information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Your existing organization info form */}
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input id="name" placeholder="Your organization name" />
                </div>
                {/* Other organization fields */}
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <SubscriptionPauseSettings
            organizationId={organizationId as string}
          />

          {/* You can add other member-related settings below */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Member Management</CardTitle>
              <CardDescription>Configure other member settings</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Other member settings would go here */}
              <p className="text-muted-foreground">
                Additional member settings will appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          {/* Your existing billing settings */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Settings</CardTitle>
              <CardDescription>
                Manage your subscription and payment information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Billing content */}
              <p className="text-muted-foreground">
                Your billing settings appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 