'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { databases, DATABASE_ID, ORGANIZATIONS_COLLECTION_ID } from '@/lib/appwrite';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Organization } from '@/types';
import CompanyPaymentInfo from '@/components/admin/company/CompanyPaymentInfo';

export default function CompanyPaymentPage() {
  const { organizationId } = useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchOrganization() {
      try {
        setLoading(true);
        if (!organizationId) return;
        
        const org = await databases.getDocument(
          DATABASE_ID,
          ORGANIZATIONS_COLLECTION_ID,
          organizationId as string
        );
        
        setOrganization(org as unknown as Organization);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch organization';
        console.error('Error fetching organization:', errorMessage);
        toast.error('Failed to load organization details');
      } finally {
        setLoading(false);
      }
    }
    
    fetchOrganization();
  }, [organizationId]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!organization) {
    return (
      <div className="p-4">
        <p>Organization not found</p>
      </div>
    );
  }
  
  // If this isn't a company-type organization, show an error
  if (organization.type !== 'company') {
    return (
      <div className="p-4">
        <p>This page is only for company-type organizations.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Subscription & Billing</h1>
      
      <CompanyPaymentInfo 
        organizationId={organizationId as string} 
        currentPlan={organization.plan || 'free'} 
      />
    </div>
  );
} 