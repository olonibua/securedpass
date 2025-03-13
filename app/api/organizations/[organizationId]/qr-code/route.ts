import { NextRequest, NextResponse } from 'next/server';
import { databases } from '@/lib/appwrite';
import { DATABASE_ID, ORGANIZATIONS_COLLECTION_ID } from '@/lib/appwrite';
import QRCode from 'qrcode';

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    // Extract organizationId from URL instead of params
    const url = request.nextUrl.pathname;
    const segments = url.split('/');
    const organizationId = segments[segments.length - 2]; // Get the ID from URL

    // Verify the organization exists
    await databases.getDocument(
      DATABASE_ID,
      ORGANIZATIONS_COLLECTION_ID,
      organizationId
    );

    // Generate check-in URL
    const checkInUrl = `${process.env.NEXT_PUBLIC_APP_URL}/check-in/${organizationId}`;
    
    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl);

    return NextResponse.json({
      qrCodeDataUrl,
      checkInUrl
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate QR code';
    console.error('Error generating QR code:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
