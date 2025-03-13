import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface WelcomeEmailProps {
  name: string;
  email: string;
  organizationId: string;
}

export async function sendWelcomeEmail({ name, email, }: WelcomeEmailProps) {
  try {
    await resend.emails.send({
      from: 'noreply@yourdomain.com',
      to: email,
      subject: 'Welcome to the Organization',
      html: `
        <h1>Welcome, ${name}!</h1>
        <p>Thank you for joining our organization.</p>
        <p>You can now sign in to your member portal.</p>
      `,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
    console.error('Email sending error:', errorMessage);
    throw error;
  }
} 