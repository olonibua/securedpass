'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, MoveUp, MoveDown } from 'lucide-react';
import { DATABASE_ID, databases, Query, CUSTOMFIELDS_COLLECTION_ID, ID } from '@/lib/appwrite';
import { toast } from 'sonner';
import { CustomField } from '@/types';

interface CustomFieldProps {
  organizationId: string;
}

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
];

export default function CustomFieldsManager({ organizationId }: CustomFieldProps) {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        setLoading(true);
        // Fetch custom fields for this organization from Appwrite
        const response = await databases.listDocuments(
          DATABASE_ID,
          CUSTOMFIELDS_COLLECTION_ID,
          [
            // Query to filter by organizationId and sort by order
            Query.equal('organizationId', organizationId),
            Query.orderAsc('order')
          ]
        );
        
        setFields(response.documents as unknown as CustomField[]);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch custom fields';
        console.error('Error fetching custom fields:', errorMessage);
        toast.error('Error fetching custom fields');
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [organizationId]);

  const addNewField = () => {
    const newField: Partial<CustomField> = {
      name: '',
      type: 'text',
      required: false,
      order: fields.length,
      organizationId,
    };
    
    setFields([...fields, newField as CustomField]);
  };

  const updateField = (index: number, key: keyof CustomField, value: any) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], [key]: value };
    setFields(updatedFields);
  };

  const removeField = (index: number) => {
    const updatedFields = [...fields];
    updatedFields.splice(index, 1);
    
    // Update order for remaining fields
    updatedFields.forEach((field, idx) => {
      field.order = idx;
    });
    
    setFields(updatedFields);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === fields.length - 1)
    ) {
      return;
    }

    const updatedFields = [...fields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap fields
    [updatedFields[index], updatedFields[newIndex]] = 
      [updatedFields[newIndex], updatedFields[index]];
    
    // Update order values
    updatedFields.forEach((field, idx) => {
      field.order = idx;
    });
    
    setFields(updatedFields);
  };

  const saveFields = async () => {
    try {
      setLoading(true);
      
      // Validate fields
      const invalidFields = fields.filter(field => !field.name.trim());
      if (invalidFields.length > 0) {
        toast.error('All fields must have a name');
        return;
      }

      // Get existing fields to determine which to update/create/delete
      const existingFields = await databases.listDocuments(
        DATABASE_ID,
        CUSTOMFIELDS_COLLECTION_ID,
        [Query.equal('organizationId', organizationId)]
      );
      
      const existingFieldsMap = new Map(
        existingFields.documents.map(doc => [doc.$id, doc])
      );
      
      // Process each field
      for (const field of fields) {
        const now = new Date().toISOString();
        
        if (field.$id && existingFieldsMap.has(field.$id)) {
          // Update existing field
          await databases.updateDocument(
            DATABASE_ID,
            CUSTOMFIELDS_COLLECTION_ID,
            field.$id,
            {
              name: field.name,
              type: field.type,
              required: field.required,
              options: field.options || [],
              placeholder: field.placeholder || '',
              order: field.order,
              updatedAt: now,
            }
          );
          existingFieldsMap.delete(field.$id);
        } else {
          // Create new field
          await databases.createDocument(
            DATABASE_ID,
            CUSTOMFIELDS_COLLECTION_ID,
            ID.unique(),
            {
              organizationId,
              name: field.name,
              type: field.type,
              required: field.required,
              options: field.options || [],
              placeholder: field.placeholder || '',
              order: field.order,
              createdAt: now,
              updatedAt: now,
            }
          );
        }
      }
      
      // Delete fields that no longer exist
      for (const [fieldId] of existingFieldsMap) {
        await databases.deleteDocument(
          DATABASE_ID,
          CUSTOMFIELDS_COLLECTION_ID,
          fieldId
        );
      }
      
      toast.success('Custom fields saved successfully');
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save custom fields';
      console.error('Error saving custom fields:', errorMessage);
      toast.error('Failed to save custom fields');
    } finally {
      setLoading(false);
    }
  };

  const renderFieldPreview = (field: CustomField) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
        return (
          <Input 
            type={field.type === 'number' ? 'number' : 'text'}
            placeholder={field.placeholder || `Enter ${field.name}`}
            disabled
          />
        );
      case 'date':
        return (
          <Input 
            type="date"
            disabled
          />
        );
      case 'select':
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || `Select ${field.name}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, i) => (
                <SelectItem key={i} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return <Input disabled />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left side: Field editor */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Field Editor</h3>
            <Button onClick={addNewField} disabled={loading} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Field
            </Button>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.$id || `new-${index}`}
              className="p-4 border rounded-md bg-card"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`field-name-${index}`}>Field Name</Label>
                  <Input
                    id={`field-name-${index}`}
                    value={field.name}
                    onChange={(e) => updateField(index, "name", e.target.value)}
                    placeholder="e.g., Full Name"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor={`field-type-${index}`}>Field Type</Label>
                  <Select
                    value={field.type}
                    onValueChange={(value) => updateField(index, "type", value)}
                    disabled={loading}
                  >
                    <SelectTrigger id={`field-type-${index}`}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor={`field-placeholder-${index}`}>
                  Placeholder
                </Label>
                <Input
                  id={`field-placeholder-${index}`}
                  value={field.placeholder || ""}
                  onChange={(e) =>
                    updateField(index, "placeholder", e.target.value)
                  }
                  placeholder="Enter placeholder text"
                  disabled={loading}
                />
              </div>

              {field.type === "select" && (
                <div className="mt-4">
                  <Label htmlFor={`field-options-${index}`}>
                    Options (comma separated)
                  </Label>
                  <Input
                    id={`field-options-${index}`}
                    value={field.options?.join(", ") || ""}
                    onChange={(e) =>
                      updateField(
                        index,
                        "options",
                        e.target.value
                          .split(",")
                          .map((opt) => opt.trim())
                          .filter(Boolean)
                      )
                    }
                    placeholder="Option 1, Option 2, Option 3"
                    disabled={loading}
                  />
                </div>
              )}

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`required-${index}`}
                    checked={field.required}
                    onCheckedChange={(checked) =>
                      updateField(index, "required", checked)
                    }
                    disabled={loading}
                  />
                  <Label htmlFor={`required-${index}`}>Required Field</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => moveField(index, "up")}
                    disabled={index === 0 || loading}
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => moveField(index, "down")}
                    disabled={index === fields.length - 1 || loading}
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeField(index)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {fields.length === 0 && !loading && (
            <div className="text-center p-8 border border-dashed rounded-md">
              <p className="text-muted-foreground">
                No custom fields defined yet. Add your first field to get
                started.
              </p>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <Button
              onClick={saveFields}
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? "Saving..." : "Save Fields"}
            </Button>
          </div>
        </div>

        {/* Right side: Form preview */}
        <div className="w-full lg:w-1/2 lg:sticky lg:top-4 h-fit">
          <div className="border rounded-md p-4 bg-muted/30 h-full">
            <h3 className="text-lg font-semibold mb-4">Form Preview</h3>
            
            <div className="mb-6 p-3 bg-primary/10 rounded border border-primary/20">
              <p className="text-sm font-medium">System fields (automatically included):</p>
              <ul className="text-sm mt-2 space-y-1 text-muted-foreground">
                <li>• Full Name (required)</li>
                <li>• Email Address (required)</li>
                <li>• Password (required)</li>
              </ul>
            </div>
            
            {fields.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-md">
                <p className="text-muted-foreground">Add fields to see a preview of your form</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={`preview-${index}`} className="space-y-2">
                    <Label>
                      {field.name}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {renderFieldPreview(field)}
                  </div>
                ))}
                <Button className="w-full" disabled>Register</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
