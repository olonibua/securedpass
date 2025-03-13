import { NextRequest, NextResponse } from 'next/server';
import { DATABASE_ID, databases, ORGANIZATIONS_COLLECTION_ID, Query, USERS_COLLECTION_ID } from '@/lib/appwrite';
import { resend } from '@/lib/resend';
import { SubscriptionReminderEmail } from '@/components/emails/subscription-reminder-email';

// This endpoint should be protected with a secret key or other authentication
// and scheduled to run daily via a cron job service like Vercel Cron

export async function GET(request: NextRequest) {
  try {
    // Check for authorization (e.g., a secret key)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get current date
    const now = new Date();
    
    // Calculate dates for 30, 14, 7, 3, and 1 day reminders
    const reminderDays = [30, 14, 7, 3, 1];
    const reminderPromises = reminderDays.map(async (days) => {
      // Calculate the date that's 'days' days from now
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + days);
      
      // Format dates for comparison (YYYY-MM-DD)
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      // Find organizations with subscriptions expiring on the target date
      const expiringOrgs = await databases.listDocuments(
        DATABASE_ID!,
        ORGANIZATIONS_COLLECTION_ID!,
        [
          // Find paid plans only
          Query.notEqual('plan', 'free'),
          // Find plans expiring on the target date
          Query.greaterThanEqual('planExpiryDate', `${targetDateStr}T00:00:00.000Z`),
          Query.lessThan('planExpiryDate', `${targetDateStr}T23:59:59.999Z`),
        ]
      );
      
      // Send reminder emails
      const emailPromises = expiringOrgs.documents.map(async (org) => {
        // Get organization owner
        const owner = await databases.getDocument(
          DATABASE_ID!,
          USERS_COLLECTION_ID!,
          org.ownerId
        );
        
        // Send reminder email
        await resend.emails.send({
          from: 'QR Check-in System <noreply@yourdomain.com>',
          to: owner.email,
          subject: `Subscription Expiring in ${days} Days - ${org.name}`,
          react: SubscriptionReminderEmail({
            ownerName: owner.name || 'Valued Customer',
            organizationName: org.name,
            expiryDate: new Date(org.planExpiryDate).toLocaleDateString(),
            daysRemaining: days,
            renewalLink: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/organizations/${org.$id}/subscription`,
            organizationLogo: org.logo,
          }),
        });
        
        return {
          organizationId: org.$id,
          organizationName: org.name,
          ownerEmail: owner.email,
          daysRemaining: days,
        };
      });
      
      return Promise.all(emailPromises);
    });
    
    // Wait for all reminder emails to be sent
    const results = await Promise.all(reminderPromises);
    
    // Flatten the results array
    const sentReminders = results.flat();
    
    return NextResponse.json({
      success: true,
      sentReminders,
      count: sentReminders.length,
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to process subscription reminders';
    console.error('Error sending subscription reminders:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
