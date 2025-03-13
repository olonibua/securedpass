'use client';

import { useState, useEffect } from 'react';
import { DATABASE_ID, databases, MEMBERS_COLLECTION_ID, Query } from '@/lib/appwrite';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, ExternalLink, } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RegistrationLinkGenerator from '@/components/admin/RegistrationLinkGenerator';

interface MembershipManagerProps {
  organizationId: string;
}

export default function MembershipManager({ organizationId }: MembershipManagerProps) {
  const [members, setMembers] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID!,
        MEMBERS_COLLECTION_ID!,
        [
          Query.equal('organizationId', organizationId),
          Query.orderDesc('createdAt')
        ]
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

  useEffect(() => {
    fetchMembers();
  }, [organizationId, fetchMembers]);

  const handleStatusChange = async (memberId: string, newStatus: 'active' | 'inactive') => {
    try {
      await databases.updateDocument(
        DATABASE_ID!,
        MEMBERS_COLLECTION_ID!,
        memberId,
        {
          status: newStatus
        }
      );
      
      toast.success(`Member ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      fetchMembers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update member status';
      console.error('Error updating member status:', errorMessage);
      toast.error('Failed to update member status');
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
      <Tabs defaultValue="directory">
        <TabsList className="mb-4">
          <TabsTrigger value="directory">Member Directory</TabsTrigger>
          
          <TabsTrigger value="registration">Registration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="directory">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-medium">Members Directory</h3>
              <p className="text-sm text-muted-foreground">
                {members.length} total members
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/organizations/${organizationId}/join`} target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Members Registration Link
                </Link>
              </Button>
            </div>
          </div>

          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No members have registered on your organization yet.</p>
              <p className="mt-2">Share your membership registration link to start growing your community.</p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.$id as string}>
                      <TableCell className="font-medium">{member.name as string}</TableCell>
                      <TableCell>{member.email as string}</TableCell>
                      <TableCell>
                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                          {member.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(member.createdAt as string)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.location.href = `mailto:${member.email}`}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Email
                          </Button>
                          {member.status === 'active' ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleStatusChange(member.$id as string, 'inactive')}
                            >
                              Deactivate
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleStatusChange(member.$id as string, 'active')}
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-6">
            <Card>
              <CardHeader className="pb-3">
                <h3 className="text-lg font-medium">Membership Growth</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Total Members</p>
                      <p className="text-2xl font-bold">{members.length}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Active Members</p>
                      <p className="text-2xl font-bold">
                        {members.filter(m => m.status === 'active').length}
                      </p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">New This Month</p>
                      <p className="text-2xl font-bold">
                        {members.filter(m => {
                          const date = new Date(m.createdAt as string);
                          const now = new Date();
                          return date.getMonth() === now.getMonth() && 
                                date.getFullYear() === now.getFullYear();
                        }).length}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        
        
        <TabsContent value="registration">
          <Card>
            <CardHeader>
              <CardTitle>Registration Links</CardTitle>
              <CardDescription>
                Generate and manage registration links for new members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegistrationLinkGenerator 
                organizationId={organizationId} 
                organizationName="Your Organization" 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 