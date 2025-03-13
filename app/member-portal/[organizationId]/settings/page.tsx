'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { databases, Query } from '@/lib/appwrite';
import { 
  DATABASE_ID, 
  MEMBERS_COLLECTION_ID,
} from '@/lib/appwrite';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Loader2, 
 
  Shield, 
  Save,
 
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface MemberDetails {
  $id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  checkInReminders?: boolean;
  paymentReminders?: boolean;
  promotionalEmails?: boolean;
}



export default function SettingsPage() {
  const { organizationId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(null);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [checkInReminders, setCheckInReminders] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);
  const [promotionalEmails, setPromotionalEmails] = useState(false);
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch member details
      const membersResponse = await databases.listDocuments(
        DATABASE_ID,
        MEMBERS_COLLECTION_ID,
        [
          Query.equal('userId', user?.$id || ''),
          ...(organizationId ? [Query.equal('organizationId', organizationId as string)] : [])
        ]
      );
      
      if (membersResponse.documents.length > 0) {
        const memberDoc = membersResponse.documents[0];
        setMemberDetails((memberDoc as unknown) as MemberDetails);
        
        // Set form values
        setFirstName(memberDoc.firstName || '');
        setLastName(memberDoc.lastName || '');
        setEmail(memberDoc.email || user?.email || '');
        setPhone(memberDoc.phone || '');
        setAddress(memberDoc.address || '');
        setCity(memberDoc.city || '');
        setState(memberDoc.state || '');
        setZipCode(memberDoc.zipCode || '');
        setEmergencyContact(memberDoc.emergencyContact || '');
        setEmergencyPhone(memberDoc.emergencyPhone || '');
        
        // Set notification preferences
        setEmailNotifications(memberDoc.emailNotifications !== false); // Default to true
        setSmsNotifications(memberDoc.smsNotifications !== false); // Default to true
        setCheckInReminders(memberDoc.checkInReminders !== false); // Default to true
        setPaymentReminders(memberDoc.paymentReminders !== false); // Default to true
        setPromotionalEmails(memberDoc.promotionalEmails === true); // Default to false
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch member data';
      console.error('Error fetching member data:', errorMessage);
      toast.error('Failed to load member data');
    } finally {
      setLoading(false);
    }
  }, [user, organizationId]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, organizationId, fetchData]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!memberDetails) {
      toast.error('Member details not found');
      return;
    }
    
    try {
      setSaving(true);
      
      // Update member details
      await databases.updateDocument(
        DATABASE_ID,
        MEMBERS_COLLECTION_ID,
        memberDetails.$id,
        {
          firstName,
          lastName,
          phone,
          address,
          city,
          state,
          zipCode,
          emergencyContact,
          emergencyPhone
        }
      );
      
      toast.success('Profile updated successfully');
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      console.error('Error updating profile:', errorMessage);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!memberDetails) {
      toast.error('Member details not found');
      return;
    }
    
    try {
      setSaving(true);
      
      // Update notification preferences
      await databases.updateDocument(
        DATABASE_ID,
        MEMBERS_COLLECTION_ID,
        memberDetails.$id,
        {
          emailNotifications,
          smsNotifications,
          checkInReminders,
          paymentReminders,
          promotionalEmails
        }
      );
      
      toast.success('Notification preferences updated');
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update notification preferences';
      console.error('Error updating notification preferences:', errorMessage);
      toast.error('Failed to update notification preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container py-10 max-w-6xl"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.prefs?.avatar || ''} alt={firstName} />
                    <AvatarFallback>{firstName?.charAt(0)}{lastName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile}>
                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="John"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          disabled
                          placeholder="john.doe@example.com"
                        />
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="123 Main St"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="New York"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="NY"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">Zip Code</Label>
                        <Input
                          id="zipCode"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          placeholder="10001"
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Emergency Contact</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="emergencyContact">Contact Name</Label>
                          <Input
                            id="emergencyContact"
                            value={emergencyContact}
                            onChange={(e) => setEmergencyContact(e.target.value)}
                            placeholder="Jane Doe"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emergencyPhone">Contact Phone</Label>
                          <Input
                            id="emergencyPhone"
                            value={emergencyPhone}
                            onChange={(e) => setEmergencyPhone(e.target.value)}
                            placeholder="+1 (555) 987-6543"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveNotifications}>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="emailNotifications">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        id="emailNotifications"
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="smsNotifications">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via text message
                        </p>
                      </div>
                      <Switch
                        id="smsNotifications"
                        checked={smsNotifications}
                        onCheckedChange={setSmsNotifications}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Notification Types</h3>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="checkInReminders">Check-in Reminders</Label>
                          <p className="text-sm text-muted-foreground">
                            Reminders about your scheduled gym sessions
                          </p>
                        </div>
                        <Switch
                          id="checkInReminders"
                          checked={checkInReminders}
                          onCheckedChange={setCheckInReminders}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="paymentReminders">Payment Reminders</Label>
                          <p className="text-sm text-muted-foreground">
                            Reminders about upcoming subscription payments
                          </p>
                        </div>
                        <Switch
                          id="paymentReminders"
                          checked={paymentReminders}
                          onCheckedChange={setPaymentReminders}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="promotionalEmails">Promotional Emails</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive special offers and promotions
                          </p>
                        </div>
                        <Switch
                          id="promotionalEmails"
                          checked={promotionalEmails}
                          onCheckedChange={setPromotionalEmails}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Preferences
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Change Password</h3>
                    <p className="text-sm text-muted-foreground">
                      Update your password to keep your account secure
                    </p>
                    <Button variant="outline" className="mt-2">
                      <Shield className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                    <Button variant="outline" className="mt-2">
                      Enable Two-Factor Authentication
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Account Activity</h3>
                    <p className="text-sm text-muted-foreground">
                      View your recent login activity
                    </p>
                    <div className="mt-4 space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <div>
                          <div className="font-medium">Current Session</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date().toLocaleString()}
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-500/10 text-green-500">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
} 