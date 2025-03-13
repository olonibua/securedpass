import { NextResponse } from 'next/server';
import { databases, ID, account } from '@/lib/appwrite';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, 
      email, 
      password, 
      organizationName, 
      industry, 
      size, 
      plan,
      organizationType 
    } = body;

    // Create user in Appwrite using the account API
    const user = await account.create(
      ID.unique(),
      email,
      password,
      name
    );

    // Create organization
    const organization = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ORGANIZATIONS_COLLECTION_ID!,
      ID.unique(),
      {
        name: organizationName,
        ownerId: user.$id,
        industry,
        size,
        plan,
        organizationType: organizationType || 'company', // Default to company if not specified
        createdAt: new Date().toISOString()
      }
    );

    // Create a session for the user
    await account.createEmailPasswordSession(email, password);

    return NextResponse.json({ 
      success: true, 
      user: { id: user.$id },
      organization: { id: organization.$id }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create organization';
    console.error("Error during signup:", errorMessage);
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
} 