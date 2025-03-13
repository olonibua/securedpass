'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { account } from '@/lib/appwrite';
import { Models } from 'appwrite';
import { toast } from 'sonner';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is logged in on initial load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async (): Promise<boolean> => {
    try {
      setLoading(true);
      const currentUser = await account.get();
      setUser(currentUser);
      return true;
    } catch (error: unknown) {
      console.error("Check auth error:", error);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Create session with Appwrite
      await account.createEmailPasswordSession(email, password);
      
      // Get user details
      const currentUser = await account.get();
      setUser(currentUser);
      
      toast.success('Logged in successfully!');
      router.push('/dashboard');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to log in';
      // console.error("Login error:", errorMessage);
      toast.error(`Login failed: ${errorMessage}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await account.deleteSession('current');
      setUser(null);
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to log out';
      console.error("Logout error:", errorMessage);
      toast.error('Failed to log out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
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