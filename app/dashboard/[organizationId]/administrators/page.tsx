import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import AdminManagement from '@/components/admin/AdminManagement';

type PageProps = {
  params: {
    organizationId: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function AdministratorsPage({ 
  params 
}: PageProps) {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administrator Management</h1>
          <p className="text-muted-foreground">
            Manage administrators for your organization.
          </p>
        </div>
        
        <Suspense fallback={
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <AdminManagement organizationId={params.organizationId} />
        </Suspense>
      </div>
    </div>
  );
} 