'use client';

import { useState, useEffect } from 'react';
import { DATABASE_ID, databases, ID, MEMBERS_COLLECTION_ID, Query } from '@/lib/appwrite';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent,  DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Member {
  $id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  lastCheckIn?: string;
}

interface CompanyMemberManagerProps {
  organizationId: string;
}

export default function CompanyMemberManager({ organizationId }: CompanyMemberManagerProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        MEMBERS_COLLECTION_ID,
        [Query.equal('organizationId', organizationId)]
      );
      
      setMembers(response.documents as unknown as Member[]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch members';
      console.error('Error fetching members:', errorMessage);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchMembers();
    }
  }, [organizationId]);

  const handleAddMember = async () => {
    try {
      if (!newMemberName || !newMemberEmail) {
        toast.error('Name and email are required');
        return;
      }

      await databases.createDocument(
        DATABASE_ID,
        MEMBERS_COLLECTION_ID,
        ID.unique(),
        {
          organizationId,
          name: newMemberName,
          email: newMemberEmail,
          phone: newMemberPhone || null,
          status: 'active',
          createdAt: new Date().toISOString()
        }
      );

      // Reset form
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberPhone('');
      setIsAddDialogOpen(false);
      
      // Refresh member list
      fetchMembers();
      toast.success('Member added successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add member';
      console.error('Error adding member:', errorMessage);
      toast.error('Failed to add member');
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      await databases.deleteDocument(
        DATABASE_ID!,
        MEMBERS_COLLECTION_ID!,
        memberId
      );
      
      toast.success('Member removed successfully');
      fetchMembers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove member';
      console.error('Error deleting member:', errorMessage);
      toast.error('Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">
          Members ({loading ? '...' : members.length})
        </h3>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Enter member name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="Enter member email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  placeholder="Enter member phone"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddMember}>Add Member</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">No members added yet</p>
            <Button 
              variant="outline" 
              onClick={() => setIsAddDialogOpen(true)}
            >
              Add Your First Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Check-in</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.$id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.phone || '—'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs ${
                    member.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {member.status}
                  </span>
                </TableCell>
                <TableCell>
                  {member.lastCheckIn 
                    ? new Date(member.lastCheckIn).toLocaleString() 
                    : 'Never'
                  }
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteMember(member.$id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
} 