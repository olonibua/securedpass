# Project Status: QR-Based Access & Attendance System

## Overview
We're building a QR-based access and attendance system with dynamic custom fields, subscription management, and email notifications. The system allows organizations to create custom check-in forms, generate QR codes for check-ins, and track attendance.

## Completed Components

### Core Infrastructure
- ✅ Appwrite integration for database and authentication
- ✅ NextAuth.js setup for authentication
- ✅ Stripe integration for subscription management
- ✅ Resend email service integration
- ✅ TypeScript type definitions for core entities
- ✅ Password recovery and reset system for all user types

### Authentication & User Management
- ✅ Unified login system for organization owners and administrators
- ✅ Separate member login portal
- ✅ Forgot password workflow with email recovery
- ✅ Password reset functionality with security validation
- ✅ Role-based access control and redirection

### Organization Management
- ✅ Organization creation with type selection (company vs. membership)
- ✅ Member portal for organization members
- ✅ Company member management with registration ID generation
- ✅ Administrator management system
- ✅ Admin activity logging and monitoring

### Check-in System
- ✅ Dynamic custom fields management
- ✅ QR code generation API
- ✅ Check-in form with dynamic fields
- ✅ Check-in API endpoint
- ✅ Email confirmation for check-ins
- ✅ Support for both membership-based and company-based check-ins

### Subscription Management
- ✅ Subscription plans configuration
- ✅ Stripe checkout integration
- ✅ Webhook handler for subscription events
- ✅ Subscription expiry reminders via cron job
- ✅ Dual payment model (subscription vs. transaction fee)
  - Organization can choose between subscription or transaction fee model
  - 30-day lock period after changing payment models
  - UI dynamically updates based on selected model
  - Transaction fee percentage customization (1-20%)
- ✅ Member payment processing
  - Transparently handles different organization payment models
  - Routes payments correctly based on organization settings
  - Calculates platform fees for transaction fee model
  - Creates pending transfers for settlement
- ✅ Subscription pause management
  - Organizations can enable/disable subscription pausing
  - Configurable maximum pauses per month
  - Configurable maximum pause duration
  - Members can pause and resume subscriptions as allowed

### UI Components
- ✅ Check-in page
- ✅ Attendance table
- ✅ QR code display
- ✅ Subscription manager
- ✅ Custom fields manager
- ✅ Payment model selector
- ✅ Payment settings information display
- ✅ Member plan selection and payment UI
- ✅ Subscription pause manager
- ✅ Company member registration form
- ✅ Company member dashboard

## In Progress
- 🔄 Analytics dashboard
- 🔄 Member management interface refinements
- 🔄 Paystack integration for membership payments

## Pending
- ⏳ Mobile optimization
- ⏳ Export functionality for attendance data
- ⏳ Advanced reporting features
- ⏳ Multi-language support
- ⏳ Comprehensive testing

## Known Issues
1. Some components are using `toast` from 'sonner' while others use '@/components/ui/use-toast'
2. Need to ensure consistent error handling across all components
3. ⚠️ **DEPENDENCY CONFLICT**: There's a conflict between `react-day-picker` and `date-fns` versions. `react-day-picker@8.10.1` requires `date-fns@^2.28.0 || ^3.0.0` but the project is using `date-fns@^4.1.0`. Either downgrade `date-fns` to version 3.x or use `--force` flag during installation.
4. ⚠️ **REACT VERSION COMPATIBILITY**: `react-day-picker` is not yet compatible with React 19. Consider using React 18 for better compatibility with third-party libraries.
5. The payment settings page exists in two locations: `/dashboard/[organizationId]/payment` (current) and `/dashboard/[organizationId]/settings/payment` (legacy). The legacy route should be removed or redirected.
6. ⚠️ **APPWRITE COLLECTIONS SETUP REQUIRED**: 
   The following collections MUST be created in Appwrite before payments will work:
   - `organizations` - Organization details
   - `members` - Organization members
   - `membership_plans` - Subscription plans
   - `membership_purchases` - Member payments (MISSING - causing current error)
   - `pending_transfers` - Funds tracking for transaction fee model

7. ⚠️ **COLLECTION SCHEMA REQUIREMENTS**:
   Each collection must have specific fields:
   - `membership_purchases`: must include fields for organizationId, planId, userId, amount, status, paymentDate, transactionReference, and paymentModelUsed

8. ⚠️ **PAYMENT INTEGRATION SETUP**:
   For organizations using subscription model, payment will fail until:
   - Organization has a valid Paystack Public Key stored in the database
   - The key is stored in `paystackPublicKey` field of the organization record

## Next Steps
1. Complete analytics for check-in patterns
2. Refine member management functionality
3. Optimize for mobile devices
4. Write tests for critical components
5. Prepare for deployment
6. Consolidate payment settings routes to a single location

## Organization Types
The system now supports two distinct organization types:

### Company/Organization
- Organization manages its own members directly
- Members don't need accounts to check in
- Organization admin registers members with generated member IDs
- Members use their provided ID to check in via QR code
- Suitable for companies, schools, and events
- **Payment Model**: Company organizations automatically use the Direct Subscription Model
  - Fixed monthly subscription plans: Free, Basic ($29/mo), Premium ($99/mo)
  - Each plan includes different member limits and feature sets
  - No transaction fees on check-ins
  - All features available based on subscription tier

### Membership Organization
- Users can register themselves as members using organization-specific registration links
- Each member belongs to exactly one organization
- Members have their own accounts and access only their organization's member portal
- Organization ID is used only to identify which organization the member belongs to
- Suitable for gyms, clubs, and membership-based services
- **Payment Model Options**: Membership organizations can choose between:
  - Direct Subscription Model
  - Transaction Fee Model

## Payment Models

The system supports two distinct payment models for membership organizations:

### Direct Subscription Model
- Organization pays a subscription fee to use the platform
- Organization receives 100% of member payments directly
- Organization connects their own Paystack account
- Best for organizations with high transaction volumes

### Transaction Fee Model
- Organization pays no subscription fee
- Platform takes a percentage fee from each member payment
- Platform handles payment processing and transfers remaining funds
- Best for organizations with lower transaction volumes or seasonal businesses
- Organizations can customize fee percentage within allowed range (1-20%)
- Organizations must provide bank details for settlement

## Member Payment Flow
The system handles member payments differently based on the organization's payment model:

### For Organizations Using Subscription Model
- Members pay directly to the organization's Paystack account
- Platform doesn't handle money transfer or take fees from member payments
- Organization is responsible for managing their Paystack account and payouts

### For Organizations Using Transaction Fee Model
- Members pay to the platform's Paystack account
- Platform calculates and retains the transaction fee
- Platform creates pending transfers to send remaining funds to organization
- Organization receives periodic settlements to their bank account

## Dependencies
All required dependencies have been installed:
- next, react, react-dom
- appwrite
- next-auth
- stripe
- resend
- react-hook-form, @hookform/resolvers, zod
- @react-email/components, @react-email/tailwind
- qrcode
- shadcn/ui components
- sonner (toast notifications)
- react-paystack

## Environment Variables
The following environment variables need to be configured:
- NEXT_PUBLIC_APP_URL
- NEXT_PUBLIC_APPWRITE_ENDPOINT
- NEXT_PUBLIC_APPWRITE_PROJECT_ID
- NEXT_PUBLIC_APPWRITE_DATABASE_ID
- APPWRITE_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_BASIC_PRICE_ID
- STRIPE_PREMIUM_PRICE_ID
- RESEND_API_KEY
- CRON_SECRET_KEY
- PAYSTACK_SECRET_KEY
- NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
- PLATFORM_PAYSTACK_SECRET_KEY
- NEXT_PUBLIC_PLATFORM_PAYSTACK_PUBLIC_KEY

## Code Standards

### Type Definitions
- No duplicate type definitions across files
- Always export interfaces used across multiple files

### Code Quality
- **Always use &apos; instead of &quot; for strings**
- **No undefined types**: Never use `(error)` as a catch block of a try statement or any other error emitting component in code
- **Always define error types**: All catch blocks must use `(error: unknown)` and properly type-check the error
- **Error handling pattern**: Always follow this pattern:
  ```typescript
  catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Default error message';
    console.error("Descriptive context:", errorMessage);
    // Additional error handling as needed
  }
  ```
- **No unused variables**: All declared variables must be used or prefixed with underscore
- **Proper error handling**: Include try/catch blocks for async operations
- **Type safety**: Use proper TypeScript types for all variables and function parameters
- **⚠️ WARNING: No unused state variables**: Don't declare state variables (useState) without using them in the component. If you declare `setIsLoading`, you must use it in the UI (e.g., showing a loading indicator). Unused state variables cause errors during Vercel deployment.
- **⚠️ WARNING: Avoid using `any` type**: Never use the `any` type as it defeats TypeScript's type checking. Instead:
  ```typescript
  // ❌ Bad
  const data: any = response.data;
  
  // ✅ Good
  const data: Record<string, unknown> = response.data;
  // Or use more specific types like:
  const data: CustomType = response.data;
  ```

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
