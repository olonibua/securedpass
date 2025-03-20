import { useState, useEffect, useCallback } from 'react';
import { databases, DATABASE_ID, MEMBERS_COLLECTION_ID, CUSTOMFIELDS_COLLECTION_ID, Query, ORGANIZATIONS_COLLECTION_ID } from '@/lib/appwrite';
import { Member, CustomField } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, UserPlus, Copy, Check, Pencil, X, Save, Trash2, Settings } from 'lucide-react';
import { toast } from 'sonner';
import MemberCreationForm from './MemberCreationForm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/lib/auth-context';

interface CompanyMemberDashboardProps {
  organizationId: string;
}

// Payment status enum
export type PaymentStatus = 'paid' | 'unpaid' | 'pending';

// Define column settings interface
interface ColumnSetting {
  id: string;
  title: string;
  visible: boolean;
  isCustomField?: boolean;
}

export default function CompanyMemberDashboard({ organizationId }: CompanyMemberDashboardProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newMemberId, setNewMemberId] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Member>>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  
  // Column visibility settings
  const [columnSettings, setColumnSettings] = useState<ColumnSetting[]>([
    { id: 'memberId', title: 'Member ID', visible: true },
    { id: 'name', title: 'Name', visible: true },
    { id: 'email', title: 'Email', visible: true },
    { id: 'phone', title: 'Phone', visible: true },
    { id: 'active', title: 'Status', visible: true },
    { id: 'paymentStatus', title: 'Payment', visible: true },
    { id: 'lastCheckIn', title: 'Last Check-in', visible: true },
    { id: 'createdAt', title: 'Created', visible: true },
    // Custom fields will be added dynamically
  ]);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const [membersResponse, fieldsResponse] = await Promise.all([
        databases.listDocuments(
          DATABASE_ID,
          MEMBERS_COLLECTION_ID,
          [
            Query.equal('organizationId', organizationId),
            Query.equal('type', 'company'),
            Query.orderDesc('createdAt')
          ]
        ),
        databases.listDocuments(
          DATABASE_ID,
          CUSTOMFIELDS_COLLECTION_ID,
          [
            Query.equal('organizationId', organizationId)
          ]
        )
      ]);
      
      setMembers(membersResponse.documents as unknown as Member[]);
      const fields = fieldsResponse.documents as unknown as CustomField[];
      setCustomFields(fields);
      
      // Update column settings to include custom fields
      setColumnSettings(prevSettings => {
        // First, filter out any old custom fields
        const filteredSettings = prevSettings.filter(col => !col.isCustomField);
        
        // Add the current custom fields
        const customFieldSettings = fields.map(field => ({
          id: field.$id,
          title: field.name,
          visible: false,
          isCustomField: true
        }));
        
        return [...filteredSettings, ...customFieldSettings];
      });
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
      console.error('Error fetching company members:', errorMessage);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Load column settings from organization document
  useEffect(() => {
    const loadColumnSettings = async () => {
      try {
        const organization = await databases.getDocument(
          DATABASE_ID,
          ORGANIZATIONS_COLLECTION_ID,
          organizationId
        );
        
        if (organization.columnSettings) {
          try {
            const compactSettings = JSON.parse(organization.columnSettings);
            
            // Convert back from compact format to full settings
            if (Array.isArray(compactSettings)) {
              const fullSettings = columnSettings.map(col => {
                const saved = compactSettings.find(s => s.id === col.id);
                return {
                  ...col,
                  visible: saved ? saved.v === 1 : col.visible
                };
              });
              
              setColumnSettings(fullSettings);
            }
          } catch (e) {
            console.error('Error parsing column settings:', e);
          }
        }
      } catch (error: unknown) {
        console.error('Error loading organization:', error);
        // Fall back to localStorage
        const localSettings = localStorage.getItem(`columnSettings-${organizationId}`);
        if (localSettings) {
          try {
            setColumnSettings(JSON.parse(localSettings));
          } catch {
            // Use default settings if parsing fails
          }
        }
      }
    };
    
    loadColumnSettings();
  }, [organizationId]);
  
  // Save column settings to organization document
  const toggleColumn = (columnId: string) => {
    setColumnSettings(prev => {
      const newSettings = prev.map(col => 
        col.id === columnId ? { ...col, visible: !col.visible } : col
      );
      
      // Save to localStorage as backup
      try {
        localStorage.setItem(`columnSettings-${organizationId}`, JSON.stringify(newSettings));
      } catch  {
        // Ignore localStorage errors
      }
      
      // Save to organization document
      saveColumnSettingsToOrganization(newSettings);
      
      return newSettings;
    });
  };
  
  // Function to save settings to organization document
  const saveColumnSettingsToOrganization = async (settings: ColumnSetting[]) => {
    try {
      // Store only the essential information - which columns are visible
      const compactSettings = settings.map(col => ({
        id: col.id,
        v: col.visible ? 1 : 0 // Compress 'visible' to 'v' with 1/0 instead of true/false
      }));
      
      await databases.updateDocument(
        DATABASE_ID,
        ORGANIZATIONS_COLLECTION_ID,
        organizationId,
        { 
          columnSettings: JSON.stringify(compactSettings)
        }
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save column settings';
      console.error('Error saving column settings to organization:', errorMessage);
    }
  };

  const copyMemberId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('Member ID copied to clipboard');
    
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const startEditing = (member: Member) => {
    setEditingMember(member.$id);
    setEditFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      paymentStatus: member.paymentStatus || 'unpaid'
    });
  };

  const cancelEditing = () => {
    setEditingMember(null);
    setEditFormData({});
  };

  const saveEditing = async (memberId: string) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        MEMBERS_COLLECTION_ID,
        memberId,
        editFormData
      );
      
      toast.success('Member updated successfully');
      setEditingMember(null);
      setEditFormData({});
      fetchMembers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update member';
      console.error('Error updating member:', errorMessage);
      toast.error('Failed to update member');
    }
  };

  const renderPaymentStatusBadge = (status?: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'unpaid':
        return <Badge variant="destructive">Unpaid</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-400">Pending</Badge>;
      default:
        return <Badge variant="outline">Unpaid</Badge>;
    }
  };

  const NewMemberIdHighlight = ({ memberId }: { memberId: string | null }) => {
    if (!memberId) return null;
    
    return (
      <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="text-center flex-1">
              <h3 className="font-bold mb-2">New Member Created!</h3>
              <p className="text-sm mb-2">Member ID for check-in:</p>
              <div className="font-mono text-lg border p-2 rounded bg-white dark:bg-gray-800">
                {memberId}
              </div>
              <p className="text-xs mt-2">Members need this ID to check in</p>
            </div>
            <Button 
              onClick={() => copyMemberId(memberId)}
              className="flex-shrink-0"
            >
              Copy ID
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Delete member function
  const deleteMember = async () => {
    if (!memberToDelete) return;
    
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        MEMBERS_COLLECTION_ID,
        memberToDelete.$id
      );
      
      toast.success("Member deleted successfully");
      setMembers(prev => prev.filter(m => m.$id !== memberToDelete.$id));
      setMemberToDelete(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete member';
      console.error('Error deleting member:', errorMessage);
      toast.error('Failed to delete member');
    }
  };

  // Render custom field value for a member
  const renderCustomFieldValue = (member: Member, fieldId: string) => {
    if (!member.customFields) return '-';
    
    try {
      const customData = JSON.parse(member.customFields);
      return customData[fieldId] || '-';
    } catch {
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get visible columns

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Company Members</h2>
        <div className="space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columnSettings.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.visible}
                  onCheckedChange={() => toggleColumn(column.id)}
                >
                  {column.title}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="outline" 
            onClick={() => fetchMembers()}
            title="Refresh members list"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      <MemberCreationForm 
        organizationId={organizationId} 
        customFields={customFields}
        onMemberCreated={(id) => {
          setNewMemberId(id);
          fetchMembers();
        }}
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) {
            fetchMembers();
          }
        }}
      />
      
      <NewMemberIdHighlight memberId={newMemberId} />

      <Card>
        <CardHeader>
          <CardTitle>Members Directory</CardTitle>
          <CardDescription>
            Manage your company members and their unique registration IDs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No members found. Create your first member to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {columnSettings.find(col => col.id === 'memberId')?.visible && 
                    <TableHead>Member ID</TableHead>}
                  
                  {columnSettings.find(col => col.id === 'name')?.visible && 
                    <TableHead>Name</TableHead>}
                  
                  {columnSettings.find(col => col.id === 'email')?.visible && 
                    <TableHead>Email</TableHead>}
                  
                  {columnSettings.find(col => col.id === 'phone')?.visible && 
                    <TableHead>Phone</TableHead>}
                  
                  {columnSettings.find(col => col.id === 'active')?.visible && 
                    <TableHead>Status</TableHead>}
                  
                  {columnSettings.find(col => col.id === 'paymentStatus')?.visible && 
                    <TableHead>Payment</TableHead>}
                  
                  {columnSettings.find(col => col.id === 'lastCheckIn')?.visible && 
                    <TableHead>Last Check-in</TableHead>}
                  
                  {columnSettings.find(col => col.id === 'createdAt')?.visible && 
                    <TableHead>Created</TableHead>}
                  
                  {/* Custom Field Headers */}
                  {columnSettings
                    .filter(col => col.isCustomField && col.visible)
                    .map(col => (
                      <TableHead key={col.id}>{col.title}</TableHead>
                    ))}
                  
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.$id}>
                    {columnSettings.find(col => col.id === 'memberId')?.visible && (
                      <TableCell className="font-mono">
                        {member.memberId || 'N/A'}
                      </TableCell>
                    )}
                    
                    {columnSettings.find(col => col.id === 'name')?.visible && (
                      <TableCell>
                        {editingMember === member.$id ? (
                          <Input 
                            value={editFormData.name || ''} 
                            onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                            className="w-full"
                          />
                        ) : (
                          member.name
                        )}
                      </TableCell>
                    )}
                    
                    {columnSettings.find(col => col.id === 'email')?.visible && (
                      <TableCell>
                        {editingMember === member.$id ? (
                          <Input 
                            value={editFormData.email || ''} 
                            onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                            className="w-full"
                          />
                        ) : (
                          member.email
                        )}
                      </TableCell>
                    )}
                    
                    {columnSettings.find(col => col.id === 'phone')?.visible && (
                      <TableCell>
                        {editingMember === member.$id ? (
                          <Input 
                            value={editFormData.phone || ''} 
                            onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                            className="w-full"
                          />
                        ) : (
                          member.phone || '-'
                        )}
                      </TableCell>
                    )}
                    
                    {columnSettings.find(col => col.id === 'active')?.visible && (
                      <TableCell>
                        <Badge variant={member.active ? 'default' : 'secondary'}>
                          {member.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    )}
                    
                    {columnSettings.find(col => col.id === 'paymentStatus')?.visible && (
                      <TableCell>
                        {editingMember === member.$id ? (
                          <Select 
                            value={editFormData.paymentStatus || 'unpaid'} 
                            onValueChange={(value) => setEditFormData({...editFormData, paymentStatus: value as PaymentStatus})}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="unpaid">Unpaid</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          renderPaymentStatusBadge(member.paymentStatus)
                        )}
                      </TableCell>
                    )}
                    
                    {columnSettings.find(col => col.id === 'lastCheckIn')?.visible && (
                      <TableCell>
                        {member.lastCheckIn ? formatDate(member.lastCheckIn) : 'Never'}
                      </TableCell>
                    )}
                    
                    {columnSettings.find(col => col.id === 'createdAt')?.visible && (
                      <TableCell>
                        {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : '-'}
                      </TableCell>
                    )}
                    
                    {/* Custom Field Values */}
                    {columnSettings
                      .filter(col => col.isCustomField && col.visible)
                      .map(col => (
                        <TableCell key={col.id}>
                          {renderCustomFieldValue(member, col.id)}
                        </TableCell>
                      ))}
                    
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {editingMember === member.$id ? (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => saveEditing(member.$id)}>
                              <Save className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={cancelEditing}>
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => startEditing(member)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyMemberId(member.memberId || '')}
                              disabled={!member.memberId}
                              title="Copy Member ID"
                            >
                              {copiedId === member.memberId ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setMemberToDelete(member)}
                              className="text-red-500"
                              title="Delete Member"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {memberToDelete?.name}&apos;s account and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteMember}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 