'use client';

import { useEffect, useState, } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Download, Printer, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
interface QRCodeDisplayProps {
  organizationId: string;
}

export default function QRCodeDisplay({ organizationId }: QRCodeDisplayProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [qrCode, setQrCode] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [checkInUrl, setCheckInUrl] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/organizations/${organizationId}/qr-code`);

        if (!response.ok) {
          throw new Error('Failed to generate QR code');
        }

        const data = await response.json();
        console.log(data);
        setQrCode(data.qrCodeDataUrl);
        setCheckInUrl(data.checkInUrl);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate QR code';
        console.error('Error fetching QR code:', errorMessage);
        toast.error('Failed to generate QR code');
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();
  }, [organizationId]);

  const handleDownload = () => {
    if (!qrCode) return;

    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `check-in-qr-code-${organizationId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!qrCode) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print the QR code");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Check-in QR Code</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              font-family: system-ui, sans-serif;
            }
            img {
              max-width: 80%;
              max-height: 80%;
            }
            h2 {
              margin-bottom: 20px;
            }
            p {
              margin-top: 20px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h2>Check-in QR Code</h2>
          <img src="${qrCode}" alt="Check-in QR Code" />
          <p>Scan this QR code to check in</p>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Print after a short delay to ensure the image is loaded
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleShare = async () => {
    if (!checkInUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check-in QR Code",
          text: "Scan this QR code to check in",
          url: checkInUrl,
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to share";
        console.error("Error sharing:", errorMessage);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(checkInUrl);
      toast.success("Check-in link copied to clipboard");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check-in QR Code</CardTitle>
        <CardDescription>
          Display this QR code for members to scan and check in
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        {loading ? (
          <div className="flex justify-center items-center h-64 w-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : qrCode ? (
          <Tabs defaultValue="qrcode" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qrcode">QR Code</TabsTrigger>
              <TabsTrigger value="link">Check-in Link</TabsTrigger>
            </TabsList>
            <TabsContent value="qrcode" className="flex justify-center">
              <div className="border p-4 rounded-md">
                <Image
                  src={qrCode}
                  alt="Check-in QR Code"
                  className="h-64 w-64 object-contain"
                  width={256}
                  height={256}
                />
              </div>
            </TabsContent>
            <TabsContent value="link">
              <div className="p-4 border rounded-md bg-muted">
                <p className="text-sm break-all">{checkInUrl}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Share this link with members who can&apos;t scan the QR code
              </p>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex justify-center items-center h-64 w-64 border rounded-md">
            <p className="text-muted-foreground">Failed to load QR code</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleDownload}
          disabled={!qrCode || loading}
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button
          variant="outline"
          onClick={handlePrint}
          disabled={!qrCode || loading}
        >
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button
          variant="outline"
          onClick={handleShare}
          disabled={!checkInUrl || loading}
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </CardFooter>
    </Card>
  );
}
