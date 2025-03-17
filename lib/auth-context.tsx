'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { account, ORGANIZATIONS_COLLECTION_ID, ORGANIZATIONS_MEMBERS_COLLECTION_ID, MEMBERS_COLLECTION_ID, DATABASE_ID } from '@/lib/appwrite';
import { Models } from 'appwrite';
import { toast } from 'sonner';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  isLoaded: boolean;
  checkUserRole: (userId: string, email: string) => Promise<'admin' | 'member' | 'none'>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      // Clear any local storage data to prevent reconnection
      localStorage.removeItem('appwrite-auth-user-id');
      // Redirect to home page instead of login page
      router.push('/');
    } catch {
      console.error('Logout error:');
    }
  };

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
      return true;
    } catch {
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial auth check
  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
    };
    
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      // Create session - Note that duration is configured in Appwrite dashboard, not here
      await account.createEmailPasswordSession(email, password);
      await checkAuth();
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      console.error("Login error:", errorMessage);
      toast.error('Login failed. Please check your credentials.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Add a helper function to check user role
  const checkUserRole = async (userId: string, email: string): Promise<'admin' | 'member' | 'none'> => {
    try {
      // Check if user is a member
      const memberCheck = await databases.listDocuments(
        DATABASE_ID!,
        MEMBERS_COLLECTION_ID!,
        [Query.equal("email", email)]
      );
      
      const orgMemberCheck = await databases.listDocuments(
        DATABASE_ID!,
        ORGANIZATIONS_MEMBERS_COLLECTION_ID!,
        [Query.equal("userId", userId)]
      );
      
      if (memberCheck.documents.length > 0 || orgMemberCheck.documents.length > 0) {
        return 'member';
      }
      
      // Check if user is an admin (has organizations)
      const adminCheck = await databases.listDocuments(
        DATABASE_ID!,
        ORGANIZATIONS_COLLECTION_ID!,
        [Query.equal("ownerId", userId)]
      );
      
      if (adminCheck.documents.length > 0) {
        return 'admin';
      }
      
      return 'none';
    } catch (error) {
      console.error('Error checking user role:', error);
      return 'none';
    }
  };

  // Add memoization to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    checkAuth,
    checkUserRole,
    isLoaded: !loading 
  }), [user, loading, login, logout, checkAuth, checkUserRole]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 