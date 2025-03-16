// Organization
export interface Organization {
  $id: string;
  name: string;
  description?: string;
  logo?: string;
  ownerId: string;
  plan: "free" | "basic" | "premium";
  planExpiryDate?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  organizationType: 'company' | 'membership';
  industry?: string;
  website?: string;
  paymentModel?: 'subscription' | 'transaction_fee';
  paystackPublicKey?: string;
  transactionFeePercentage?: number;
}

// Custom Field
export interface CustomField {
  $id: string;
  organizationId: string;
  name: string;
  type: "text" | "number" | "email" | "phone" | "date" | "select";
  required: boolean;
  options?: string[];
  placeholder?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Member
export interface Member {
  $id: string;
  organizationId?: string;
  email?: string;
  name?: string;
  profileData?: any;
  active?: boolean;
  lastCheckIn?: string;
  createdAt: string;
  updatedAt: string;
  hasActiveSubscription?: boolean;
  latestPayment?: any;
  subscriptionType?: string;
  expiryDate?: Date | null;
  planName?: string;
  status?: string;
  planId?: string;
  planStartDate?: string;
}

// Check-in
export interface CheckIn {
  $id: string;
  organizationId: string;
  memberId?: string;
  timestamp: string;
  customFieldValues: Record<string, string>;
  deviceInfo?: string;
}

// Organization Member (for admin users)
export interface OrganizationMember {
  $id: string;
  organizationId: string;
  userId: string;
  role: "admin" | "viewer";
  createdAt: string;
}

// Subscription Plan
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  limits: {
    checkInsPerMonth: number;
    adminUsers: number;
    customFields: number;
  };
}

// Payment Method
export interface PaymentMethod {
  $id: string;
  userId: string;
  type: string;
  cardBrand: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
  createdAt: string;
}

// Payment History
export interface PaymentHistory {
  $id: string;
  userId: string;
  amount: number;
  status: string;
  date: string;
  description: string;
}

// Membership Plan
export interface MembershipPlan {
  $id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  features?: string | string[];
  isActive: boolean;
  intervalDescription?: string;
}

// Subscription
export interface Subscription {
  $id: string;
  userId: string;
  planId: string;
  organizationId: string;
  status: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

// Add this to your existing types/index.ts file:
export type PaymentModel = 'subscription' | 'transaction_fee';
