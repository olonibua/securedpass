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
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <MemberSidebar organizationId={organizationId} onSignOut={handleSignOut} />
      <motion.main 
        className="flex-1 overflow-y-auto p-4 md:pt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container mx-auto max-w-6xl px-0 md:px-4">
          {children}
        </div>
      </motion.main>
    </div>
  );
} 