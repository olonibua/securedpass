'use client';

import { useState, useEffect } from 'react';
import { DATABASE_ID, databases, ID, MEMBERS_COLLECTION_ID, Query } from '@/lib/appwrite';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface CompanyMemberManagerProps {
  organizationId: string;
}

export default function CompanyMemberManager({ organizationId }: CompanyMemberManagerProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [organizationId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID!,
        MEMBERS_COLLECTION_ID!,
        [Query.equal('organizationId', organizationId)]
      );
      
      setMembers(response.documents);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch members';
      console.error('Error fetching members:', errorMessage);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    try {
      if (!newMemberName || !newMemberEmail) {
        toast.error('Please provide both name and email');
        return;
      }

      setIsAddingMember(true);
      
      // Create member directly (no user account needed for company members)
      await databases.createDocument(
        DATABASE_ID!,
        MEMBERS_COLLECTION_ID!,
        ID.unique(),
        {
          organizationId,
          name: newMemberName,
          email: newMemberEmail,
          status: 'active',
          createdAt: new Date().toISOString()
        }
      );
      
      toast.success('Member added successfully');
      setNewMemberName('');
      setNewMemberEmail('');
      setIsDialogOpen(false);
      fetchMembers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add member';
      console.error('Error adding member:', errorMessage);
      toast.error('Failed to add member');
    } finally {
      setIsAddingMember(false);
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
      <div className="flex justify-end mb-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
              <DialogDescription>
                Add a new member to your company organization.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMember} disabled={isAddingMember}>
                {isAddingMember && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No members found. Add your first member to get started.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.$id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{formatDate(member.createdAt)}</TableCell>
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