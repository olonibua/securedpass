# SecuredPass - Appwrite Collections Schema

This document outlines all the collections and their attributes required for the SecuredPass QR-based access system.

## Database Setup Instructions

1. Create a new database in your Appwrite project
2. Create each collection below with the exact attributes specified
3. Set permissions as indicated for each collection
4. Update your `.env` file with the collection IDs

---

## 1. Users Collection
**Collection ID**: `users`

| Attribute Name | Type | Size | Required | Default | Index | Description |
|---|---|---|---|---|---|---|
| `userId` | String | 50 | ✅ | - | ✅ | Appwrite Auth user ID (must match) |
| `email` | String | 255 | ✅ | - | ✅ | User email address |
| `name` | String | 255 | ✅ | - | - | User full name |
| `phone` | String | 20 | ❌ | - | - | Phone number |
| `avatar` | String | 500 | ❌ | - | - | Avatar/profile image URL |
| `role` | String | 20 | ✅ | "user" | - | user, admin, super_admin |
| `isActive` | Boolean | - | ✅ | true | - | User account status |
| `emailVerified` | Boolean | - | ✅ | false | - | Email verification status |
| `phoneVerified` | Boolean | - | ❌ | false | - | Phone verification status |
| `lastLogin` | String | 50 | ❌ | - | - | Last login timestamp |
| `preferences` | String | 2000 | ❌ | "{}" | - | JSON user preferences |
| `timezone` | String | 50 | ❌ | "UTC" | - | User timezone |
| `language` | String | 10 | ❌ | "en" | - | Preferred language |
| `metadata` | String | 2000 | ❌ | "{}" | - | Additional JSON metadata |
| `createdAt` | String | 50 | ✅ | - | ✅ | Creation timestamp |
| `updatedAt` | String | 50 | ✅ | - | - | Last update timestamp |

**Permissions**: 
- Read: User (own record), Organization admins
- Write: User (own record), System
- Delete: User (own record), System admin

**Notes**: 
- This collection stores extended user profile data beyond Appwrite's built-in Auth
- The `userId` field must match the Appwrite Auth user ID
- Used for storing additional profile information and user preferences

---

## 2. Organizations Collection
**Collection ID**: `organizations`

| Attribute Name | Type | Size | Required | Default | Index | Description |
|---|---|---|---|---|---|---|
| `name` | String | 255 | ✅ | - | - | Organization name |
| `description` | String | 1000 | ❌ | - | - | Organization description |
| `logo` | String | 500 | ❌ | - | - | Logo URL |
| `ownerId` | String | 50 | ✅ | - | ✅ | Appwrite user ID of owner |
| `plan` | String | 50 | ✅ | "free" | - | Subscription plan (free/basic/premium) |
| `planExpiryDate` | String | 50 | ❌ | - | - | Plan expiry date (ISO string) |
| `stripeCustomerId` | String | 100 | ❌ | - | - | Stripe customer ID |
| `stripeSubscriptionId` | String | 100 | ❌ | - | - | Stripe subscription ID |
| `memberCount` | Integer | - | ❌ | 0 | - | Total member count |
| `organizationType` | String | 50 | ✅ | "company" | - | company or membership |
| `industry` | String | 100 | ❌ | - | - | Industry type |
| `website` | String | 255 | ❌ | - | - | Website URL |
| `paymentModel` | String | 50 | ❌ | "subscription" | - | subscription or transaction_fee |
| `paystackPublicKey` | String | 255 | ❌ | - | - | Paystack public key |
| `transactionFeePercentage` | Float | - | ❌ | 5.0 | - | Transaction fee percentage (1-20) |
| `pauseSettings` | String | 2000 | ❌ | - | - | JSON string of pause settings |
| `createdAt` | String | 50 | ✅ | - | ✅ | Creation timestamp |
| `updatedAt` | String | 50 | ✅ | - | - | Last update timestamp |

**Permissions**: 
- Read: Users, Admins
- Write: Owner, Admins
- Delete: Owner only

---

## 2. Members Collection
**Collection ID**: `members`

| Attribute Name | Type | Size | Required | Default | Index | Description |
|---|---|---|---|---|---|---|
| `userId` | String | 50 | ❌ | - | ✅ | Appwrite user ID (for membership orgs) |
| `organizationId` | String | 50 | ✅ | - | ✅ | Organization reference |
| `email` | String | 255 | ✅ | - | ✅ | Member email address |
| `name` | String | 255 | ❌ | - | - | Member full name |
| `phone` | String | 20 | ❌ | - | - | Phone number |
| `memberId` | String | 50 | ❌ | - | ✅ | Unique registration ID (company) |
| `status` | String | 20 | ✅ | "active" | - | active, inactive, suspended |
| `type` | String | 20 | ✅ | "company" | - | company or membership |
| `active` | Boolean | - | ✅ | true | - | Member active status |
| `lastCheckIn` | String | 50 | ❌ | - | - | Last check-in timestamp |
| `hasActiveSubscription` | Boolean | - | ❌ | false | - | Subscription status |
| `subscriptionType` | String | 100 | ❌ | - | - | Subscription type name |
| `planId` | String | 50 | ❌ | - | - | Membership plan ID |
| `planName` | String | 100 | ❌ | - | - | Plan display name |
| `planStartDate` | String | 50 | ❌ | - | - | Plan start date |
| `expiryDate` | String | 50 | ❌ | - | - | Plan expiry date |
| `subscriptionId` | String | 100 | ❌ | - | - | External subscription ID |
| `paymentStatus` | String | 20 | ❌ | "unpaid" | - | paid, unpaid, pending |
| `customFields` | String | 5000 | ❌ | - | - | JSON string of custom data |
| `createdAt` | String | 50 | ✅ | - | ✅ | Creation timestamp |
| `updatedAt` | String | 50 | ✅ | - | - | Last update timestamp |

**Permissions**: 
- Read: Organization members, Admins
- Write: Organization admins, System
- Delete: Organization owner, Admins

---

## 3. Organizations Members Collection
**Collection ID**: `organizations_members`

| Attribute Name | Type | Size | Required | Default | Index | Description |
|---|---|---|---|---|---|---|
| `organizationId` | String | 50 | ✅ | - | ✅ | Organization reference |
| `userId` | String | 50 | ✅ | - | ✅ | Appwrite user ID |
| `role` | String | 20 | ✅ | "viewer" | - | admin, manager, viewer |
| `permissions` | String | 1000 | ❌ | - | - | JSON array of permissions |
| `invitedBy` | String | 50 | ❌ | - | - | User ID who sent invite |
| `joinedAt` | String | 50 | ✅ | - | - | Join timestamp |
| `createdAt` | String | 50 | ✅ | - | ✅ | Creation timestamp |

**Permissions**: 
- Read: Organization members
- Write: Organization admins
- Delete: Organization owner, Self

---

## 4. Custom Fields Collection
**Collection ID**: `custom_fields`

| Attribute Name | Type | Size | Required | Default | Index | Description |
|---|---|---|---|---|---|---|
| `organizationId` | String | 50 | ✅ | - | ✅ | Organization reference |
| `name` | String | 100 | ✅ | - | - | Field name (for forms) |
| `label` | String | 255 | ✅ | - | - | Display label |
| `type` | String | 20 | ✅ | - | - | text, number, email, phone, date, select |
| `required` | Boolean | - | ✅ | false | - | Field required status |
| `options` | String | 2000 | ❌ | - | - | JSON array for select options |
| `placeholder` | String | 255 | ❌ | - | - | Input placeholder text |
| `order` | Integer | - | ✅ | 0 | - | Display order |
| `validation` | String | 500 | ❌ | - | - | JSON validation rules |
| `createdAt` | String | 50 | ✅ | - | ✅ | Creation timestamp |
| `updatedAt` | String | 50 | ✅ | - | - | Last update timestamp |

**Permissions**: 
- Read: Organization members
- Write: Organization admins
- Delete: Organization admins

---

## 5. Check-ins Collection
**Collection ID**: `checkins`

| Attribute Name | Type | Size | Required | Default | Index | Description |
|---|---|---|---|---|---|---|
| `organizationId` | String | 50 | ✅ | - | ✅ | Organization reference |
| `memberId` | String | 50 | ❌ | - | ✅ | Member reference (if applicable) |
| `memberEmail` | String | 255 | ❌ | - | ✅ | Member email |
| `memberName` | String | 255 | ❌ | - | - | Member name |
| `memberRegistrationId` | String | 50 | ❌ | - | - | Member ID for company orgs |
| `timestamp` | String | 50 | ✅ | - | ✅ | Check-in timestamp |
| `customFieldValues` | String | 5000 | ❌ | - | - | JSON object of custom field values |
| `deviceInfo` | String | 1000 | ❌ | - | - | Device/browser information |
| `ipAddress` | String | 45 | ❌ | - | - | Client IP address |
| `location` | String | 255 | ❌ | - | - | Check-in location |
| `status` | String | 20 | ✅ | "completed" | - | completed, failed, pending |
| `createdAt` | String | 50 | ✅ | - | ✅ | Creation timestamp |

**Permissions**: 
- Read: Organization members, Admins
- Write: Organization members, System
- Delete: Organization admins

---

## 6. Subscriptions Collection
**Collection ID**: `subscriptions`

| Attribute Name | Type | Size | Required | Default | Index | Description |
|---|---|---|---|---|---|---|
| `userId` | String | 50 | ✅ | - | ✅ | User reference |
| `organizationId` | String | 50 | ✅ | - | ✅ | Organization reference |
| `planId` | String | 50 | ✅ | - | - | Plan identifier |
| `planName` | String | 100 | ✅ | - | - | Plan display name |
| `status` | String | 20 | ✅ | - | ✅ | active, paused, cancelled, expired |
| `startDate` | String | 50 | ✅ | - | - | Subscription start date |
| `endDate` | String | 50 | ❌ | - | - | Subscription end date |
| `renewalDate` | String | 50 | ❌ | - | - | Next renewal date |
| `amount` | Float | - | ✅ | - | - | Subscription amount |
| `currency` | String | 3 | ✅ | "USD" | - | Currency code |
| `interval` | String | 20 | ✅ | - | - | monthly, yearly |
| `stripeSubscriptionId` | String | 100 | ❌ | - | - | Stripe subscription ID |
| `paystackSubscriptionCode` | String | 100 | ❌ | - | - | Paystack subscription code |
| `createdAt` | String | 50 | ✅ | - | ✅ | Creation timestamp |
| `updatedAt` | String | 50 | ✅ | - | - | Last update timestamp |

**Permissions**: 
- Read: User, Organization admins
- Write: System, Organization admins
- Delete: System only

---

## 7. Membership Plans Collection
**Collection ID**: `membership_plans`

| Attribute Name | Type | Size | Required | Default | Index | Description |
|---|---|---|---|---|---|---|
| `organizationId` | String | 50 | ✅ | - | ✅ | Organization reference |
| `name` | String | 255 | ✅ | - | - | Plan name |
| `description` | String | 1000 | ❌ | - | - | Plan description |
| `price` | Float | - | ✅ | - | - | Plan price |
| `currency` | String | 3 | ✅ | "USD" | - | Currency code |
| `interval` | String | 20 | ✅ | - | - | monthly, yearly, weekly |
| `intervalCount` | Integer | - | ✅ | 1 | - | Interval multiplier |
| `features` | String | 2000 | ❌ | - | - | JSON array of features |
| `isActive` | Boolean | - | ✅ | true | - | Plan active status |
| `maxMembers` | Integer | - | ❌ | - | - | Maximum members allowed |
| `trialDays` | Integer | - | ❌ | 0 | - | Trial period days |
| `createdAt` | String | 50 | ✅ | - | ✅ | Creation timestamp |
| `updatedAt` | String | 50 | ✅ | - | - | Last update timestamp |

**Permissions**: 
- Read: Organization members
- Write: Organization admins
- Delete: Organization admins

---

## 8. Membership Purchases Collection
**Collection ID**: `membership_purchases`

| Attribute Name | Type | Size | Required | Default | Index | Description |
|---|---|---|---|---|---|---|
| `organizationId` | String | 50 | ✅ | - | ✅ | Organization reference |
| `userId` | String | 50 | ✅ | - | ✅ | User reference |
| `planId` | String | 50 | ✅ | - | - | Plan reference |
| `amount` | Float | - | ✅ | - | - | Purchase amount |
| `currency` | String | 3 | ✅ | "USD" | - | Currency code |
| `status` | String | 20 | ✅ | - | ✅ | pending, completed, failed, refunded |
| `paymentDate` | String | 50 | ❌ | - | - | Payment completion date |
| `startDate` | String | 50 | ✅ | - | - | Membership start date |
| `endDate` | String | 50 | ✅ | - | - | Membership end date |
| `transactionReference` | String | 100 | ✅ | - | ✅ | Payment gateway reference |
| `paymentMethod` | String | 20 | ❌ | - | - | card, bank_transfer, etc. |
| `paymentModelUsed` | String | 20 | ✅ | - | - | subscription, transaction_fee |
| `platformFee` | Float | - | ❌ | - | - | Platform fee amount |
| `organizationAmount` | Float | - | ❌ | - | - | Amount to organization |
| `createdAt` | String | 50 | ✅ | - | ✅ | Creation timestamp |
| `updatedAt` | String | 50 | ✅ | - | - | Last update timestamp |

**Permissions**: 
- Read: User, Organization admins
- Write: System, Organization admins
- Delete: System only

---

## 9. Pending Transfers Collection
**Collection ID**: `pending_transfers`

| Attribute Name | Type | Size | Required | Default | Index | Description |
|---|---|---|---|---|---|---|
| `organizationId` | String | 50 | ✅ | - | ✅ | Organization reference |
| `purchaseId` | String | 50 | ✅ | - | - | Purchase reference |
| `amount` | Float | - | ✅ | - | - | Transfer amount |
| `currency` | String | 3 | ✅ | "USD" | - | Currency code |
| `status` | String | 20 | ✅ | "pending" | ✅ | pending, processing, completed, failed |
| `transferReference` | String | 100 | ❌ | - | - | Payment gateway transfer ID |
| `recipientCode` | String | 100 | ❌ | - | - | Paystack recipient code |
| `bankDetails` | String | 1000 | ❌ | - | - | JSON bank account details |
| `scheduledDate` | String | 50 | ❌ | - | - | Scheduled transfer date |
| `completedDate` | String | 50 | ❌ | - | - | Actual completion date |
| `failureReason` | String | 500 | ❌ | - | - | Failure description |
| `retryCount` | Integer | - | ✅ | 0 | - | Number of retry attempts |
| `createdAt` | String | 50 | ✅ | - | ✅ | Creation timestamp |
| `updatedAt` | String | 50 | ✅ | - | - | Last update timestamp |

**Permissions**: 
- Read: Organization admins, System
- Write: System only
- Delete: System only

---

## 10. Registration Codes Collection
**Collection ID**: `registration_codes`

| Attribute Name | Type | Size | Required | Default | Index | Description |
|---|---|---|---|---|---|---|
| `organizationId` | String | 50 | ✅ | - | ✅ | Organization reference |
| `code` | String | 50 | ✅ | - | ✅ | Unique registration code |
| `type` | String | 20 | ✅ | - | - | admin, member, viewer |
| `maxUses` | Integer | - | ✅ | 1 | - | Maximum uses allowed |
| `currentUses` | Integer | - | ✅ | 0 | - | Current usage count |
| `expiryDate` | String | 50 | ❌ | - | - | Code expiry date |
| `isActive` | Boolean | - | ✅ | true | - | Code active status |
| `createdBy` | String | 50 | ✅ | - | - | Creator user ID |
| `description` | String | 255 | ❌ | - | - | Code description |
| `createdAt` | String | 50 | ✅ | - | ✅ | Creation timestamp |
| `updatedAt` | String | 50 | ✅ | - | - | Last update timestamp |

**Permissions**: 
- Read: Organization admins
- Write: Organization admins
- Delete: Organization admins

---

## 11. Administrators Collection
**Collection ID**: `administrators`

| Attribute Name | Type | Size | Required | Default | Index | Description |
|---|---|---|---|---|---|---|
| `userId` | String | 50 | ✅ | - | ✅ | Appwrite user ID |
| `organizationId` | String | 50 | ✅ | - | ✅ | Organization reference |
| `role` | String | 20 | ✅ | "admin" | - | admin, super_admin, manager |
| `permissions` | String | 2000 | ❌ | - | - | JSON array of permissions |
| `isActive` | Boolean | - | ✅ | true | - | Admin active status |
| `lastLogin` | String | 50 | ❌ | - | - | Last login timestamp |
| `createdBy` | String | 50 | ❌ | - | - | Creator user ID |
| `createdAt` | String | 50 | ✅ | - | ✅ | Creation timestamp |
| `updatedAt` | String | 50 | ✅ | - | - | Last update timestamp |

**Permissions**: 
- Read: Organization admins, Self
- Write: Organization owner, Self (limited)
- Delete: Organization owner

---

## 12. Admin Activity Collection
**Collection ID**: `admin_activity`

| Attribute Name | Type | Size | Required | Default | Index | Description |
|---|---|---|---|---|---|---|
| `organizationId` | String | 50 | ✅ | - | ✅ | Organization reference |
| `adminId` | String | 50 | ✅ | - | ✅ | Admin user ID |
| `action` | String | 100 | ✅ | - | ✅ | Action performed |
| `resourceType` | String | 50 | ✅ | - | - | Type of resource affected |
| `resourceId` | String | 50 | ❌ | - | - | ID of affected resource |
| `details` | String | 2000 | ❌ | - | - | JSON details of action |
| `ipAddress` | String | 45 | ❌ | - | - | Admin IP address |
| `userAgent` | String | 500 | ❌ | - | - | Browser/device info |
| `timestamp` | String | 50 | ✅ | - | ✅ | Action timestamp |
| `severity` | String | 20 | ✅ | "info" | - | info, warning, error, critical |

**Permissions**: 
- Read: Organization admins
- Write: System only
- Delete: System only (with retention policy)

---

## 13. Subscription Pauses Collection
**Collection ID**: `subscription_pauses`

| Attribute Name | Type | Size | Required | Default | Index | Description |
|---|---|---|---|---|---|---|
| `userId` | String | 50 | ✅ | - | ✅ | User reference |
| `organizationId` | String | 50 | ✅ | - | ✅ | Organization reference |
| `subscriptionId` | String | 50 | ✅ | - | - | Subscription reference |
| `startDate` | String | 50 | ✅ | - | - | Pause start date |
| `endDate` | String | 50 | ✅ | - | - | Pause end date |
| `duration` | Integer | - | ✅ | - | - | Pause duration in days |
| `status` | String | 20 | ✅ | "active" | ✅ | active, resumed, cancelled |
| `reason` | String | 500 | ❌ | - | - | Pause reason |
| `resumedAt` | String | 50 | ❌ | - | - | Resume timestamp |
| `createdAt` | String | 50 | ✅ | - | ✅ | Creation timestamp |

**Permissions**: 
- Read: User, Organization admins
- Write: User, Organization admins
- Delete: User, Organization admins

---

## 14. User Preferences Collection
**Collection ID**: `user_preferences`

| Attribute Name | Type | Size | Required | Default | Index | Description |
|---|---|---|---|---|---|---|
| `userId` | String | 50 | ✅ | - | ✅ | User reference |
| `organizationId` | String | 50 | ❌ | - | ✅ | Organization reference (optional) |
| `preferences` | String | 5000 | ✅ | "{}" | - | JSON preferences object |
| `theme` | String | 20 | ❌ | "light" | - | UI theme preference |
| `language` | String | 10 | ❌ | "en" | - | Language preference |
| `timezone` | String | 50 | ❌ | "UTC" | - | User timezone |
| `notifications` | String | 1000 | ❌ | - | - | JSON notification settings |
| `createdAt` | String | 50 | ✅ | - | ✅ | Creation timestamp |
| `updatedAt` | String | 50 | ✅ | - | - | Last update timestamp |

**Permissions**: 
- Read: User only
- Write: User only
- Delete: User only

---

## 15. Payment Methods Collection
**Collection ID**: `payment_methods`

| Attribute Name | Type | Size | Required | Default | Index | Description |
|---|---|---|---|---|---|---|
| `userId` | String | 50 | ✅ | - | ✅ | User reference |
| `organizationId` | String | 50 | ❌ | - | ✅ | Organization reference |
| `type` | String | 20 | ✅ | - | - | card, bank_account, mobile_money |
| `provider` | String | 20 | ✅ | - | - | stripe, paystack |
| `providerId` | String | 100 | ✅ | - | - | Provider's method ID |
| `cardBrand` | String | 20 | ❌ | - | - | visa, mastercard, etc. |
| `last4` | String | 4 | ❌ | - | - | Last 4 digits |
| `expiryMonth` | String | 2 | ❌ | - | - | Card expiry month |
| `expiryYear` | String | 4 | ❌ | - | - | Card expiry year |
| `bankName` | String | 100 | ❌ | - | - | Bank name |
| `accountNumber` | String | 20 | ❌ | - | - | Account number (masked) |
| `isDefault` | Boolean | - | ✅ | false | - | Default payment method |
| `isActive` | Boolean | - | ✅ | true | - | Method active status |
| `createdAt` | String | 50 | ✅ | - | ✅ | Creation timestamp |
| `updatedAt` | String | 50 | ✅ | - | - | Last update timestamp |

**Permissions**: 
- Read: User only
- Write: User only
- Delete: User only

---

## 16. Transactions Collection
**Collection ID**: `transactions`

| Attribute Name | Type | Size | Required | Default | Index | Description |
|---|---|---|---|---|---|---|
| `userId` | String | 50 | ✅ | - | ✅ | User reference |
| `organizationId` | String | 50 | ✅ | - | ✅ | Organization reference |
| `type` | String | 20 | ✅ | - | ✅ | subscription, membership, refund |
| `amount` | Float | - | ✅ | - | - | Transaction amount |
| `currency` | String | 3 | ✅ | "USD" | - | Currency code |
| `status` | String | 20 | ✅ | - | ✅ | pending, completed, failed, cancelled |
| `provider` | String | 20 | ✅ | - | - | stripe, paystack |
| `providerTransactionId` | String | 100 | ✅ | - | ✅ | Provider transaction ID |
| `reference` | String | 100 | ✅ | - | ✅ | Unique reference |
| `description` | String | 255 | ❌ | - | - | Transaction description |
| `metadata` | String | 2000 | ❌ | - | - | JSON metadata |
| `feeAmount` | Float | - | ❌ | - | - | Platform fee amount |
| `netAmount` | Float | - | ❌ | - | - | Net amount to organization |
| `processedAt` | String | 50 | ❌ | - | - | Processing timestamp |
| `createdAt` | String | 50 | ✅ | - | ✅ | Creation timestamp |
| `updatedAt` | String | 50 | ✅ | - | - | Last update timestamp |

**Permissions**: 
- Read: User, Organization admins
- Write: System only
- Delete: System only (with retention policy)

---

## Global Permissions Setup

### For all collections, set these general permissions:

**Create**: 
- Users (for their own data)
- Organization admins (for organization data)
- System API key (for automated processes)

**Read**: 
- Users (for their own data)
- Organization members (for organization data they have access to)
- Organization admins (for all organization data)

**Update**: 
- Users (for their own data)
- Organization admins (for organization data)
- System API key (for automated processes)

**Delete**: 
- Users (for their own non-critical data)
- Organization owners (for organization data)
- System API key (for maintenance)

---

## Indexes to Create

For optimal performance, create these indexes:

1. **Users**: `userId`, `email`, `createdAt`
2. **Organizations**: `ownerId`, `createdAt`
3. **Members**: `organizationId`, `email`, `userId`, `memberId`, `createdAt`
4. **Organizations_Members**: `organizationId`, `userId`
5. **Custom_Fields**: `organizationId`, `order`
6. **Checkins**: `organizationId`, `timestamp`, `memberId`
7. **Subscriptions**: `userId`, `organizationId`, `status`
8. **Membership_Purchases**: `organizationId`, `userId`, `status`, `transactionReference`
9. **Pending_Transfers**: `organizationId`, `status`
10. **Registration_Codes**: `code`, `organizationId`
11. **Administrators**: `userId`, `organizationId`
12. **Admin_Activity**: `organizationId`, `adminId`, `timestamp`
13. **Subscription_Pauses**: `userId`, `organizationId`, `status`
14. **User_Preferences**: `userId`
15. **Payment_Methods**: `userId`
16. **Transactions**: `userId`, `organizationId`, `status`, `reference`

---

## Notes

1. **String Attributes**: All dates are stored as ISO strings for consistency
2. **JSON Fields**: Complex data structures are stored as JSON strings
3. **Permissions**: Adjust based on your security requirements
4. **Indexes**: Create indexes on frequently queried fields for better performance
5. **Validation**: Set up attribute validations in Appwrite console as needed
6. **Size Limits**: Adjust string sizes based on your specific requirements

Remember to update your `.env` file with the actual collection IDs after creating them in Appwrite!