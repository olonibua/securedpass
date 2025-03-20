import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import AdminManagement from '@/components/admin/AdminManagement';
import { PageProps } from '@/.next/types/app/dashboard/[organizationId]/administrators/page';

// Import the specific PageProps type that Next.js is generating for this page
export default async function AdministratorsPage(props: PageProps) {
  // Await the params since they're a Promise
  const params = await props.params;
  const organizationId = params.organizationId;

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Administrator Management
          </h1>
          <p className="text-muted-foreground">
            Manage administrators for your organization.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center h-[60vh]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <AdminManagement organizationId={organizationId} />
        </Suspense>
      </div>
    </div>
  );
} 