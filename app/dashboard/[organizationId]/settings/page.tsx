'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { databases, DATABASE_ID, ORGANIZATIONS_COLLECTION_ID } from '@/lib/appwrite';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { organizationId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [organization, setOrganization] = useState<any>(null);
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    contactEmail: '',
    website: '',
  });

  const fetchOrganization = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await databases.getDocument(
        DATABASE_ID!,
        ORGANIZATIONS_COLLECTION_ID!,
        organizationId as string
      );
      
      setOrganization(response);
      setFormValues({
        name: response.name || '',
        description: response.description || '',
        contactEmail: response.contactEmail || '',
        website: response.website || '',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load organization';
      console.error('Error loading organization:', errorMessage);
      toast.error('Failed to load organization details');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      fetchOrganization();
    }
  }, [organizationId, fetchOrganization]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      await databases.updateDocument(
        DATABASE_ID!,
        ORGANIZATIONS_COLLECTION_ID!,
        organizationId as string,
        {
          name: formValues.name,
          description: formValues.description,
          contactEmail: formValues.contactEmail,
          website: formValues.website,
        }
      );
      
      toast.success('Organization settings updated');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update settings';
      console.error('Error updating settings:', errorMessage);
      toast.error('Failed to update organization settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your organization settings</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Organization Information</CardTitle>
            <CardDescription>Update your organization's basic information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input 
                id="name"
                name="name"
                value={formValues.name}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                name="description"
                value={formValues.description}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input 
                id="contactEmail"
                name="contactEmail"
                type="email"
                value={formValues.contactEmail}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input 
                id="website"
                name="website"
                value={formValues.website}
                onChange={handleInputChange}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
} 