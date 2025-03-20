'use client';
import { useState } from 'react';
import { databases, DATABASE_ID, ADMINISTRATORS_COLLECTION_ID, ID, Query, ADMIN_ACTIVITY_COLLECTION_ID, account, ORGANIZATIONS_MEMBERS_COLLECTION_ID } from '@/lib/appwrite';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

interface AdminRegistrationFormProps {
  organizationId: string;
  onClose: () => void;
  onAdminAdded: (password?: string) => void;
}

export default function AdminRegistrationForm({ 
  organizationId,
  onClose,
  onAdminAdded
}: AdminRegistrationFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
  });

  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
    };
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // First check if an admin with this email already exists for this organization
      const response = await databases.listDocuments(
        DATABASE_ID,
        ADMINISTRATORS_COLLECTION_ID,
        [
          Query.equal("email", email.toLowerCase()),
          Query.equal("organizationId", organizationId),
        ]
      );

      if (response.documents.length > 0) {
        setErrors({
          ...errors,
          email: "An administrator with this email already exists",
        });
        setLoading(false);
        return;
      }

      // Generate a temporary password
      const tempPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(10).slice(-2);

      // Create an Appwrite account for the administrator
      const newUser = await account.create(
        ID.unique(),
        email.toLowerCase(),
        tempPassword,
        name
      );

      // Create the administrator record
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const adminRecord = await databases.createDocument(
        DATABASE_ID,
        ADMINISTRATORS_COLLECTION_ID,
        ID.unique(),
        {
          name,
          email: email.toLowerCase(),
          role,
          status: "active",
          organizationId,
          createdAt: new Date().toISOString(),
          createdBy: user?.$id,
          lastLogin: null,
          userId: newUser.$id, // Link to their Appwrite account
        }
      );

      // Create organization_members relationship to grant access to the dashboard
      await databases.createDocument(
        DATABASE_ID,
        ORGANIZATIONS_MEMBERS_COLLECTION_ID,
        ID.unique(),
        {
          userId: newUser.$id,
          organizationId,
          role: role, // Use the selected role
          createdAt: new Date().toISOString(),
        }
      );

      // Create an activity log entry
      await databases.createDocument(
        DATABASE_ID,
        ADMIN_ACTIVITY_COLLECTION_ID,
        ID.unique(),
        {
          organizationId,
          adminId: user?.$id,
          adminName: user?.name,
          action: "added_admin",
          details: `Added ${name} (${email}) as ${role}`,
          timestamp: new Date().toISOString(),
        }
      );

      onAdminAdded(tempPassword);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add administrator';
      console.error('Error adding administrator:', errorMessage);
      toast.error('Failed to add administrator');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Administrator</DialogTitle>
            <DialogDescription>
              Add a new administrator to your organization. They will be able to log in with the generated password.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Administrator'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 