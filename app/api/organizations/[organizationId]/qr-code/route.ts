import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { databases, DATABASE_ID, ORGANIZATIONS_COLLECTION_ID } from '@/lib/appwrite';

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const organizationId = params.organizationId;
    
    // Verify the organization exists
    await databases.getDocument(
      DATABASE_ID,
      ORGANIZATIONS_COLLECTION_ID,
      organizationId
    );
    
    // Generate QR code for check-in URL
    const checkInUrl = `${process.env.NEXT_PUBLIC_APP_URL}/check-in/${organizationId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl);
    
    return NextResponse.json({
      qrCodeDataUrl,
      checkInUrl
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate QR code';
    console.error('Error generating QR code:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
