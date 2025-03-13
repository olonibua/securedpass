'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { account } from '@/lib/appwrite';
import { toast } from 'sonner';
import MemberSidebar from '@/components/member/MemberSidebar';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';

export default function MemberPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as string | undefined;
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const handleSignOut = async () => {
    try {
      await account.deleteSession('current');
      router.push('/member-login');
      toast.success('Signed out successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      console.error('Sign out error:', errorMessage);
      toast.error('Failed to sign out');
    }
  };
  
  if (!isMounted) {
    return null; // Prevents hydration errors
  }
  
  return (
    <div className="flex min-h-screen bg-background gap-6">
      <MemberSidebar organizationId={organizationId} onSignOut={handleSignOut} />
      <motion.main 
        className="flex-1 overflow-y-auto pt-4 md:pt-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="md:pl-0 pl-12">
          {children}
        </div>
      </motion.main>
    </div>
  );
} 