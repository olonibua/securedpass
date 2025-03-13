import { NextRequest, NextResponse } from 'next/server';
import { DATABASE_ID, databases, ORGANIZATIONS_COLLECTION_ID, Query, USERS_COLLECTION_ID } from '@/lib/appwrite';
import { resend } from '@/lib/resend';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

// This is needed to parse the raw body for Stripe webhook verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const chunks: Buffer[] = [];
    const reader = (request.body as ReadableStream<Uint8Array>).getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
    const rawBody = Buffer.concat(chunks).toString('utf8');
    
    // Get the Stripe signature from headers
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }
    
    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Get the metadata from the session
        const { organizationId, planId, userId } = session.metadata || {};
        
        if (organizationId && planId) {
          // Calculate expiry date (1 year from now)
          const now = new Date();
          const expiryDate = new Date();
          expiryDate.setFullYear(now.getFullYear() + 1);
          
          // Update organization plan
          await databases.updateDocument(
            DATABASE_ID!,
            ORGANIZATIONS_COLLECTION_ID!,
            organizationId,
            {
              plan: planId,
              planExpiryDate: expiryDate.toISOString(),
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
            }
          );
          
          // Get user and organization details for email
          const user = await databases.getDocument(
            DATABASE_ID!,
            USERS_COLLECTION_ID!,
            userId
          );
          
          const organization = await databases.getDocument(
            DATABASE_ID!,
            ORGANIZATIONS_COLLECTION_ID!,
            organizationId
          );
          
          // Send confirmation email
          await resend.emails.send({
            from: 'QR Check-in System <noreply@yourdomain.com>',
            to: user.email,
            subject: `Subscription Confirmed - ${organization.name}`,
            text: `Thank you for subscribing to the ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan for ${organization.name}. Your subscription is now active and will expire on ${expiryDate.toLocaleDateString()}.`,
          });
        }
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        // Find the organization with this subscription ID
        const organizations = await databases.listDocuments(
          DATABASE_ID!,
          ORGANIZATIONS_COLLECTION_ID!,
          [Query.equal('stripeSubscriptionId', subscriptionId)]
        );
        
        if (organizations.total > 0) {
          const organization = organizations.documents[0];
          
          // Calculate new expiry date (extend by 1 year from current expiry)
          const currentExpiry = new Date(organization.planExpiryDate);
          const newExpiry = new Date(currentExpiry);
          newExpiry.setFullYear(currentExpiry.getFullYear() + 1);
          
          // Update organization with new expiry date
          await databases.updateDocument(
            DATABASE_ID!,
            ORGANIZATIONS_COLLECTION_ID!,
            organization.$id,
            {
              planExpiryDate: newExpiry.toISOString(),
            }
          );
          
          // Get organization owner
          const owner = await databases.getDocument(
            DATABASE_ID!,
            USERS_COLLECTION_ID!,
            organization.ownerId
          );
          
          // Send renewal confirmation email
          await resend.emails.send({
            from: 'QR Check-in System <noreply@yourdomain.com>',
            to: owner.email,
            subject: `Subscription Renewed - ${organization.name}`,
            text: `Your subscription for ${organization.name} has been successfully renewed. Your subscription is now active until ${newExpiry.toLocaleDateString()}.`,
          });
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find the organization with this subscription ID
        const organizations = await databases.listDocuments(
          DATABASE_ID!,
          ORGANIZATIONS_COLLECTION_ID!,
          [Query.equal('stripeSubscriptionId', subscription.id)]
        );
        
        if (organizations.total > 0) {
          const organization = organizations.documents[0];
          
          // Downgrade organization to free plan
          await databases.updateDocument(
            DATABASE_ID!,
            ORGANIZATIONS_COLLECTION_ID!,
            organization.$id,
            {
              plan: 'free',
              planExpiryDate: null,
              stripeSubscriptionId: null,
            }
          );
          
          // Get organization owner
          const owner = await databases.getDocument(
            DATABASE_ID!,
            USERS_COLLECTION_ID!,
            organization.ownerId
          );
          
          // Send cancellation email
          await resend.emails.send({
            from: 'QR Check-in System <noreply@yourdomain.com>',
            to: owner.email,
            subject: `Subscription Cancelled - ${organization.name}`,
            text: `Your subscription for ${organization.name} has been cancelled. Your organization has been downgraded to the Free plan with limited features.`,
          });
        }
        break;
      }
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to process webhook';
    console.error('Error handling Stripe webhook:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
