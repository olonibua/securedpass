# Directory Structure

## Root Files
- next.config.js
- package.json
- tsconfig.json
- eslint.config.mjs
- README.md
- PROJECT_STATUS.md

## /app (Next.js App Router)
- /app
  - layout.tsx
  - page.tsx
  - globals.css
  - /login
    - page.tsx  # Unified login (organization owners & admins)
  - /member-login
    - page.tsx  # Separate login for members
  - /forgot-password
    - page.tsx  # Password recovery request
  - /reset-password
    - page.tsx  # Password reset form
  - /register
    - page.tsx
  - /dashboard
    - /[organizationId]
      - layout.tsx
      - page.tsx
      - /check-ins
        - page.tsx
      - /members
        - page.tsx
      - /company-members
        - page.tsx
      - /payment
        - page.tsx
      - /company-payment
        - page.tsx
      - /settings
        - page.tsx
    - /organizations
    - /[organizationId]
      - /join
        - page.tsx
  - /member-portal
    - /[organizationId]
      - /plans
        - page.tsx
  - /check-in
    - /[organizationId]
      - page.tsx
  - /api
    - /webhooks
      - /stripe
        - route.ts
      - /paystack
        - route.ts
    - /organizations
      - /[organizationId]
        - /qr-code
          - route.ts
    - /cron
      - /subscription-reminders
        - route.ts
    - /membership
      - /register
        - route.ts
    - /checkout
      - /session
        - route.ts

## /components
- /ui (shadcn components)
  - /button
  - /card
  - /form
  - /input
  - /collapsible
  - /label
  - /avatar
  - /popover
  - /toast
- /layout
  - Header.tsx
- /emails
  - subscription-reminder-email.tsx
- /organization
  - PaymentModelSelector.tsx
  - PaymentIntegration.tsx
  - PaymentSettingsInfo.tsx
  - SubscriptionManager.tsx
- /admin
  - /membership
    - MembershipManager.tsx
    - MembershipPlanManager.tsx
  - /company
    - MemberCreationForm.tsx
    - CompanyMemberDashboard.tsx
    - CompanyMemberManager.tsx
    - CompanyPaymentInfo.tsx
- /member
  - MemberSidebar.tsx
  - SubscriptionPauseManager.tsx

## /lib (Utilities)
- appwrite.ts
- auth.ts
- auth-context.tsx
- resend.ts

## /types
- index.ts
- appwrite.ts
- next-auth.d.ts

## /public
- entryflex.webp
- images and static assets
