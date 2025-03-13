import { account } from '@/lib/appwrite';

export const authOptions = {
  // This is a placeholder to satisfy the import
  // The actual authentication is handled in your auth-context.tsx
};

// Helper function to get the current user for server components/API routes
export async function getCurrentUser() {
  try {
    const user = await account.get();
    return user;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get current user';
    console.error('Error getting current user:', errorMessage);
    return null;
  }
} 