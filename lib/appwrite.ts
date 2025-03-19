import { Client, Account, Databases, Storage, ID, Query } from "appwrite";

// Initialize the Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

// Initialize Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Export ID and Query for convenience
export { ID, Query };

// Helper function to initialize Appwrite on the server
export const initServerAppwrite = () => {
  const serverClient = new Client()
    .setEndpoint(
      process.env.APPWRITE_ENDPOINT ||
        process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!
    )
    .setProject(
      process.env.APPWRITE_PROJECT_ID ||
        process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!
    );
  // .setKey(process.env.APPWRITE_API_KEY!);

  const serverDatabases = new Databases(serverClient);
  const serverStorage = new Storage(serverClient);

  return {
    serverClient,
    serverDatabases,
    serverStorage,
  };
};

// Export environment variables directly
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "";
export const USERS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID || "";
export const MEMBERS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_MEMBERS_COLLECTION_ID || "";
export const ORGANIZATIONS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_ORGANIZATIONS_COLLECTION_ID || "";
export const ORGANIZATIONS_MEMBERS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_ORGANIZATIONS_MEMBERS_COLLECTION_ID || "";
export const CUSTOMFIELDS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_CUSTOMFIELDS_COLLECTION_ID || "";
export const CHECKINS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_CHECKINS_COLLECTION_ID || "";
export const SUBSCRIPTIONS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID || "";
export const REGISTRATION_CODES_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_REGISTRATION_CODES_COLLECTION_ID; // Add this to your .env file later
export const MEMBERSHIP_PLANS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_MEMBERSHIP_PLANS_COLLECTION_ID;
export const MEMBERSHIP_PURCHASES_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_MEMBERSHIP_PURCHASES_COLLECTION_ID || "";
export const PENDING_TRANSFERS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_PENDING_TRANSFERS_COLLECTION_ID || "";

export const PAYMENT_METHODS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_PAYMENT_METHODS_COLLECTION_ID || "";
export const TRANSACTIONS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID || "";
export const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
export const PLATFORM_PAYSTACK_SECRET_KEY =
  process.env.PLATFORM_PAYSTACK_SECRET_KEY || "";
export const PLATFORM_PAYSTACK_PUBLIC_KEY =
  process.env.PLATFORM_PAYSTACK_PUBLIC_KEY || "";

// Add to the existing constants in appwrite.ts
export const SUBSCRIPTION_PAUSES_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_SUBSCRIPTION_PAUSES_COLLECTION_ID || "";
export const USER_PREFERENCES_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_USER_PREFERENCES_COLLECTION_ID || "";

export const ADMINISTRATORS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_ADMINISTRATORS_COLLECTION_ID || "";
export const ADMIN_ACTIVITY_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_ADMIN_ACTIVITY_COLLECTION_ID || "";
