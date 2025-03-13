import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { DATABASE_ID, databases, ORGANIZATIONS_COLLECTION_ID } from '@/lib/appwrite';
import Stripe from 'stripe';
// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const PLANS: Record<string, { price: number; name: string; stripe_price_id?: string }> = {
  free: {
    price: 0,
    name: 'Free Plan',
    stripe_price_id: undefined,
  },
  basic: {
    price: 2900, // $29.00 in cents
    name: 'Basic Plan',
    stripe_price_id: process.env.STRIPE_BASIC_PRICE_ID,
  },
  premium: {
    price: 9900, // $99.00 in cents
    name: 'Premium Plan',
    stripe_price_id: process.env.STRIPE_PREMIUM_PRICE_ID,
  },
};

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { organizationId, planId } = body;
    
    if (!organizationId || !planId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify the user has access to this organization
    const organization = await databases.getDocument(
      DATABASE_ID!,
      ORGANIZATIONS_COLLECTION_ID!,
      organizationId
    );
    
    if (organization.ownerId !== user.$id) {
      return NextResponse.json(
        { error: 'Only the organization owner can change subscription plans' },
        { status: 403 }
      );
    }
    
    // If downgrading to free plan, no payment needed
    if (planId === 'free') {
      // Update organization plan
      await databases.updateDocument(
        DATABASE_ID!,
        ORGANIZATIONS_COLLECTION_ID!,
        organizationId,
        {
          plan: 'free',
          planExpiryDate: null,
        }
      );
      
      return NextResponse.json({
        success: true,
        message: 'Downgraded to Free plan successfully',
      });
    }
    
    // Get the plan details
    const plan = PLANS[planId as keyof typeof PLANS];
    
    if (!plan || !plan.stripe_price_id) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }
    
    // Create a Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/organizations/${organizationId}/subscription?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/organizations/${organizationId}/subscription?canceled=true`,
      customer_email: user.email,
      client_reference_id: organizationId,
      metadata: {
        organizationId,
        planId,
        userId: user.$id,
      },
    });
    
    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
    console.error('Error creating checkout session:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
