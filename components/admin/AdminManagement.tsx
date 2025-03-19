'use client';
import { useState, useEffect, useCallback } from 'react';
import { databases, DATABASE_ID, ADMINISTRATORS_COLLECTION_ID, ORGANIZATIONS_COLLECTION_ID, Query, ID } from '@/lib/appwrite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Loader2, Trash2, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { useAuth } from '@/lib/auth-context';
import AdminRegistrationForm from './AdminRegistrationForm';
import AdminActivityLog from './AdminActivityLog';

interface Administrator {
  $id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string | null;
  createdAt: string;
  createdBy: string;
  organizationId: string;
}

interface AdminManagementProps {
  organizationId: string;
}

export default function AdminManagement({ organizationId }: AdminManagementProps) {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<Administrator[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [organization, setOrganization] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState<string>('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      
      // First fetch the organization to check if user is owner
      const orgResponse = await databases.getDocument(
        DATABASE_ID,
        ORGANIZATIONS_COLLECTION_ID,
        organizationId
      );
      
      setOrganization(orgResponse);
      setIsOwner(user?.$id === orgResponse.ownerId);
      
      // Then fetch administrators
      const response = await databases.listDocuments(
        DATABASE_ID,
        ADMINISTRATORS_COLLECTION_ID,
        [
          Query.equal('organizationId', organizationId),
          Query.orderDesc('createdAt')
        ]
      );
      
      setAdmins(response.documents as unknown as Administrator[]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch administrators';
      console.error('Error fetching administrators:', errorMessage);
      toast.error('Failed to load administrators');
    } finally {
      setLoading(false);
    }
  }, [organizationId, user]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleRemoveAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to remove this administrator?')) {
      return;
    }
    
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        ADMINISTRATORS_COLLECTION_ID,
        adminId
      );
      
      toast.success('Administrator removed successfully');
      fetchAdmins();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove administrator';
      console.error('Error removing administrator:', errorMessage);
      toast.error('Failed to remove administrator');
    }
  };

  const handleAdminAdded = (password?: string) => {
    setShowRegistrationForm(false);
    fetchAdmins();
    
    if (password) {
      setTempPassword(password);
      setShowPasswordModal(true);
    } else {
      toast.success('Administrator added successfully');
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {organization?.name} - Administrator Management
        </h2>
        
        {isOwner && (
          <Button onClick={() => setShowRegistrationForm(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Administrator
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="administrators">
        <TabsList>
          <TabsTrigger value="administrators">Administrators</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>
        
        <TabsContent value="administrators">
          <Card>
            <CardHeader>
              <CardTitle>Administrators</CardTitle>
            </CardHeader>
            <CardContent>
              {admins.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No administrators found.</p>
                  {isOwner && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setShowRegistrationForm(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Your First Administrator
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left">Name</th>
                        <th className="px-4 py-3 text-left">Email</th>
                        <th className="px-4 py-3 text-left">Role</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Last Login</th>
                        <th className="px-4 py-3 text-left">Added On</th>
                        {isOwner && <th className="px-4 py-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => (
                        <tr key={admin.$id} className="border-b">
                          <td className="px-4 py-3">{admin.name}</td>
                          <td className="px-4 py-3">{admin.email}</td>
                          <td className="px-4 py-3 capitalize">{admin.role}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${
                              admin.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {admin.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {admin.lastLogin 
                              ? new Date(admin.lastLogin).toLocaleString() 
                              : 'Never'}
                          </td>
                          <td className="px-4 py-3">
                            {new Date(admin.createdAt).toLocaleDateString()}
                          </td>
                          {isOwner && (
                            <td className="px-4 py-3 text-right">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemoveAdmin(admin.$id)}
                                disabled={user?.$id === admin.createdBy} // Can't remove self
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity">
          <AdminActivityLog organizationId={organizationId} />
        </TabsContent>
      </Tabs>
      
      {showRegistrationForm && (
        <AdminRegistrationForm
          organizationId={organizationId}
          onClose={() => setShowRegistrationForm(false)}
          onAdminAdded={handleAdminAdded}
        />
      )}
      
      {showPasswordModal && (
        <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Administrator Added Successfully</DialogTitle>
              <DialogDescription>
                Please save this temporary password. It will only be shown once.
              </DialogDescription>
            </DialogHeader>
            
            <div className="my-6">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="font-medium text-sm text-yellow-800 mb-2">Temporary Password:</p>
                <div className="flex items-center justify-between bg-white p-3 rounded border">
                  <code className="font-mono text-sm font-bold">{tempPassword}</code>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(tempPassword);
                      toast.success('Password copied to clipboard');
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-2">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> Share this password securely with the administrator.
                They will use it to log in for the first time.
              </p>
            </div>
            
            <DialogFooter>
              <Button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setTempPassword('');
                }}
              >
                I've Saved the Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 