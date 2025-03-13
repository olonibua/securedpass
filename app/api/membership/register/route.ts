import { NextResponse } from 'next/server';
import { databases, ID, account } from '@/lib/appwrite';
import { DATABASE_ID, MEMBERS_COLLECTION_ID, ORGANIZATIONS_MEMBERS_COLLECTION_ID } from '@/lib/appwrite';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { organizationId, name, email, password, customFieldValues } = body;
    
    if (!organizationId || !name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create a user account
    const user = await account.create(
      ID.unique(),
      email,
      password,
      name
    );
    
    // Create an active member record
    const member = await databases.createDocument(
      DATABASE_ID,
      MEMBERS_COLLECTION_ID,
      ID.unique(),
      {
        organizationId,
        userId: user.$id,
        name,
        email,
        status: 'active', // Directly active, no approval needed
        customFields: JSON.stringify(customFieldValues),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
    
    // Create organization_members relationship
    await databases.createDocument(
      DATABASE_ID,
      ORGANIZATIONS_MEMBERS_COLLECTION_ID,
      ID.unique(),
      {
        userId: user.$id,
        organizationId,
        role: 'member',
        createdAt: new Date().toISOString()
      }
    );
    
    // Send welcome email
    try {
      await sendWelcomeEmail({
        name,
        email,
        organizationId
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue with the process even if email fails
    }
    
    // Create a session for the user
    await account.createEmailPasswordSession(email, password);
    
    return NextResponse.json({ 
      success: true, 
      memberId: member.$id,
      userId: user.$id
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to register';
    console.error('Error registering member:', errorMessage);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 