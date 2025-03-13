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
  organizationId: string;
  email: string;
  name?: string;
  profileData: Record<string, any>;
  active: boolean;
  lastCheckIn?: string;
  createdAt: string;
  updatedAt: string;
}

// Check-in
export interface CheckIn {
  $id: string;
  organizationId: string;
  memberId?: string;
  timestamp: string;
  customFieldValues: Record<string, any>;
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
