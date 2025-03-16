import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { databases, DATABASE_ID, ORGANIZATIONS_COLLECTION_ID } from '@/lib/appwrite';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify webhook signature
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');
    
    // We'll need both organization and platform Paystack secret keys
    const platformSecret = process.env.PLATFORM_PAYSTACK_SECRET_KEY;
    
    // Initial verification with platform key (for transaction fee model)
    let hash = crypto.createHmac('sha512', platformSecret!)
      .update(body)
      .digest('hex');
    
    let verified = hash === signature;
    
    // Parse request body
    const payload = JSON.parse(body);
    const { event: eventName, data } = payload;
    
    // Extract metadata
    const { metadata } = data;
    const { organizationId, planId, userId, paymentModel, transactionFeePercentage } = metadata || {};
    
    if (!verified && paymentModel === 'subscription') {
      // If not verified with platform key and model is subscription, try with org key
      try {
        // Get organization's Paystack secret key
        const organization = await databases.getDocument(
          DATABASE_ID,
          ORGANIZATIONS_COLLECTION_ID,
          organizationId
        );
        
        const orgSecret = organization.paystackSecretKey;
        
        if (orgSecret) {
          // Try to verify with organization's key
          hash = crypto.createHmac('sha512', orgSecret)
            .update(body)
            .digest('hex');
          
          verified = hash === signature;
        }
      } catch (error) {
        console.error('Error verifying with organization key:', error);
      }
    }
    
    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Handle successful charge event
    if (eventName === 'charge.success') {
      // Record the purchase
      await databases.createDocument(
        DATABASE_ID,
        'membership_purchases',
        'unique()',
        {
          organizationId,
          planId,
          userId,
          amount: data.amount / 100, // Convert back from kobo/cents
          transactionReference: data.reference,
          paymentDate: new Date().toISOString(),
          status: 'completed',
          paymentModel,
          // For transaction fee model, calculate platform fee
          ...(paymentModel === 'transaction_fee' && {
            feePercentage: transactionFeePercentage,
            platformFee: (data.amount / 100) * (transactionFeePercentage / 100),
            pendingTransfer: true
          })
        }
      );
      
      // Register membership
      await databases.createDocument(
        DATABASE_ID,
        'organization_members',
        'unique()',
        {
          organizationId,
          userId,
          planId,
          status: 'active',
          joinedAt: new Date().toISOString(),
          // Set expiry date based on plan interval if applicable
          // This would need to be calculated based on the plan details
        }
      );
      
      // For transaction fee model, create a record for later transfer
      if (paymentModel === 'transaction_fee') {
        const feeAmount = (data.amount / 100) * (transactionFeePercentage / 100);
        const transferAmount = (data.amount / 100) - feeAmount;
        
        await databases.createDocument(
          DATABASE_ID,
          'pending_transfers',
          'unique()',
          {
            organizationId,
            transactionReference: data.reference,
            amount: transferAmount,
            feeAmount,
            status: 'pending',
            createdAt: new Date().toISOString()
          }
        );
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 