import { NextRequest, NextResponse } from 'next/server';
import { DATABASE_ID, ORGANIZATIONS_COLLECTION_ID, CHECKINS_COLLECTION_ID, MEMBERS_COLLECTION_ID,   databases, ID } from '@/lib/appwrite';
import { resend } from '@/lib/resend';
import { CheckInEmailTemplate } from '@/components/emails/check-in-email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, customFieldValues, memberId } = body;
    
    if (!organizationId || !customFieldValues) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Fetch organization to verify it exists
    const organization = await databases.getDocument(
      DATABASE_ID!,
      ORGANIZATIONS_COLLECTION_ID!,
      organizationId
    );
    
    // Create check-in record
    const checkInId = ID.unique();
    const now = new Date().toISOString();
    
    await databases.createDocument(
      DATABASE_ID!,
      CHECKINS_COLLECTION_ID!,
      checkInId,
      {
        organizationId,
        memberId: memberId || null, // May be null for guest check-ins
        timestamp: now,
        customFieldValues,
        deviceInfo: request.headers.get('user-agent') || '',
      }
    );
    
    // If this is a member check-in, update their last check-in time
    if (memberId) {
      await databases.updateDocument(
        DATABASE_ID!,
        MEMBERS_COLLECTION_ID!,
        memberId,
        {
          lastCheckIn: now,
        }
      );
      
      // Fetch member to get their email
      const member = await databases.getDocument(
        DATABASE_ID!,
        MEMBERS_COLLECTION_ID!,
        memberId
      );
      
      // Send check-in confirmation email if member has email
      if (member.email) {
        await resend.emails.send({
          from: `${organization.name} <noreply@yourdomain.com>`,
          to: member.email,
          subject: `Check-in Confirmation - ${organization.name}`,
          react: CheckInEmailTemplate({
            memberName: member.name || 'Member',
            organizationName: organization.name,
            checkInTime: new Date(now).toLocaleString(),
            organizationLogo: organization.logo,
          }),
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      checkInId,
      timestamp: now,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to process check-in';
    console.error('Error processing check-in:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
