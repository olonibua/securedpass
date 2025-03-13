import { Resend } from 'resend';

// Initialize Resend
export const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to send a templated email
export const sendEmail = async ({
  to,
  subject,
  react,
  from = 'QR Check-in System <noreply@yourdomain.com>',
}: {
  to: string | string[];
  subject: string;
  react: React.ReactNode;
  from?: string;
}) => {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      react,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
    console.error('Error in sendEmail:', errorMessage);
    throw error;
  }
};
