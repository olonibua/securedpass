import { useState } from 'react';
import { databases, DATABASE_ID, MEMBERS_COLLECTION_ID, ID, Query } from '@/lib/appwrite';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { CustomField } from '@/types';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { 
  RadioGroup,
  RadioGroupItem
} from '@/components/ui/radio-group';

interface MemberCreationFormProps {
  organizationId: string;
  customFields: CustomField[];
  onMemberCreated?: (memberId: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MemberCreationForm({ 
  organizationId, 
  customFields,
  onMemberCreated,
  open,
  onOpenChange
}: MemberCreationFormProps) {
  const [loading, setLoading] = useState(false);
  const [idMethod, setIdMethod] = useState<'system' | 'custom'>('system');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    customMemberId: '',
    customFieldValues: {} as Record<string, string>
  });
  const [customIdError, setCustomIdError] = useState<string | null>(null);

  const generateMemberId = (name: string) => {
    // Get initials from name (up to 3 characters)
    const initials = name
      .split(' ')
      .map(part => part[0]?.toUpperCase() || '')
      .join('')
      .substring(0, 3);
    
    // Get org prefix (first 3 chars of org ID)
    const orgPrefix = organizationId.substring(0, 3).toUpperCase();
    
    // Generate a random 4-digit number
    const random = Math.floor(1000 + Math.random() * 9000);
    
    // Format: ORG-INI-1234
    return `${orgPrefix}-${initials}-${random}`;
  };

  const validateCustomId = async () => {
    if (idMethod !== 'custom' || !formData.customMemberId) return true;
    
    try {
      // Check if member ID already exists
      const existingMembers = await databases.listDocuments(
        DATABASE_ID,
        MEMBERS_COLLECTION_ID,
        [
          Query.equal('organizationId', organizationId),
          Query.equal('memberId', formData.customMemberId)
        ]
      );
      
      if (existingMembers.documents.length > 0) {
        setCustomIdError('This Member ID is already in use');
        return false;
      }
      
      setCustomIdError(null);
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate member ID';
      console.error('Error validating member ID:', errorMessage);
      setCustomIdError('Error checking ID availability');
      return false;
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      email: '', 
      phone: '', 
      customMemberId: '', 
      customFieldValues: {} 
    });
    setIdMethod('system');
    setCustomIdError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Make sure name and email are provided
      if (!formData.name || !formData.email) {
        toast.error('Name and email are required');
        return;
      }
      
      // For custom IDs, validate uniqueness
      if (idMethod === 'custom') {
        if (!formData.customMemberId) {
          toast.error('Member ID is required when using custom ID');
          return;
        }
        
        const isValid = await validateCustomId();
        if (!isValid) return;
      }

      // Generate or use provided member ID
      const memberId = idMethod === 'system' 
        ? generateMemberId(formData.name)
        : formData.customMemberId;
      
      // Initial member data
      const initialMemberData = {
        organizationId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        status: 'active',
        type: 'company',
        memberId: memberId, // Include memberId directly in initial creation
        customFields: Object.keys(formData.customFieldValues).length > 0 
          ? JSON.stringify(formData.customFieldValues) 
          : null,
        active: true,
        userId: null,
        paymentStatus: 'unpaid',
        createdAt: new Date().toISOString()
      };

      // Create the document
      const newMember = await databases.createDocument(
        DATABASE_ID,
        MEMBERS_COLLECTION_ID,
        ID.unique(),
        initialMemberData
      );

      console.log("Member created:", newMember);
      
      // Reset form and show success message
      resetForm();
      toast.success(`Member created with ID: ${memberId}`);
      
      if (onMemberCreated) {
        onMemberCreated(memberId);
      }
      
      // Close the modal
      onOpenChange(false);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create member';
      console.error('Error creating member:', errorMessage);
      toast.error('Failed to create member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1234567890"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label>Member ID Method</Label>
            <RadioGroup 
              value={idMethod} 
              onValueChange={(value) => setIdMethod(value as 'system' | 'custom')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system">System Generated</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom">Organization Provided</Label>
              </div>
            </RadioGroup>
          </div>

          {idMethod === 'custom' && (
            <div className="space-y-3">
              <Label htmlFor="customMemberId">
                Custom Member ID *
              </Label>
              <Input
                id="customMemberId"
                placeholder="MEMBER-001"
                value={formData.customMemberId}
                onChange={(e) => setFormData({ ...formData, customMemberId: e.target.value })}
                required={idMethod === 'custom'}
                className={customIdError ? "border-red-500" : ""}
              />
              {customIdError && (
                <p className="text-sm text-red-500">{customIdError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter a unique identifier that members will use to check in
              </p>
            </div>
          )}

          {customFields.map((field) => (
            <div key={field.$id} className="space-y-3">
              <Label htmlFor={field.$id}>
                {field.name}
                {field.required && ' *'}
              </Label>
              
              {field.type === 'select' ? (
                <Select
                  value={formData.customFieldValues[field.$id] || ''}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    customFieldValues: {
                      ...formData.customFieldValues,
                      [field.$id]: value
                    }
                  })}
                  disabled={loading}
                >
                  <SelectTrigger id={field.$id}>
                    <SelectValue placeholder={field.placeholder || `Select ${field.name}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'date' ? (
                <Input
                  id={field.$id}
                  type="date"
                  placeholder={field.placeholder}
                  value={formData.customFieldValues[field.$id] || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    customFieldValues: {
                      ...formData.customFieldValues,
                      [field.$id]: e.target.value
                    }
                  })}
                  required={field.required}
                  disabled={loading}
                />
              ) : (
                <Input
                  id={field.$id}
                  type={
                    field.type === 'email' ? 'email' :
                    field.type === 'number' ? 'number' :
                    field.type === 'phone' ? 'tel' : 'text'
                  }
                  placeholder={field.placeholder || `Enter ${field.name}`}
                  value={formData.customFieldValues[field.$id] || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    customFieldValues: {
                      ...formData.customFieldValues,
                      [field.$id]: e.target.value
                    }
                  })}
                  required={field.required}
                  disabled={loading}
                />
              )}
            </div>
          ))}

          <DialogFooter className="flex flex-row justify-end gap-2 mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Member'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 