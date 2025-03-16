import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';

interface SubscriptionReminderEmailProps {
  ownerName: string;
  organizationName: string;
  expiryDate: string;
  daysRemaining: number;
  renewalLink: string;
  organizationLogo?: string;
}

export const SubscriptionReminderEmail = ({
  ownerName,
  organizationName,
  expiryDate,
  daysRemaining,
  renewalLink,
  organizationLogo,
}: SubscriptionReminderEmailProps) => {
  const previewText = `Your subscription for ${organizationName} is expiring soon`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto p-4 max-w-[600px]">
            <Section className="bg-white p-8 rounded-lg shadow-sm">
              {organizationLogo && (
                <Img
                  src={organizationLogo}
                  alt={organizationName}
                  width="120"
                  height="auto"
                  className="mx-auto mb-4"
                />
              )}
              <Heading className="text-xl font-bold text-center text-gray-800 mb-6">
                Subscription Expiry Reminder
              </Heading>
              <Text className="text-gray-700 mb-4">
                Hello {ownerName},
              </Text>
              <Text className="text-gray-700 mb-4">
                This is a friendly reminder that your subscription for <strong>{organizationName}</strong> will expire in <strong>{daysRemaining} days</strong> on <strong>{expiryDate}</strong>.
              </Text>
              <Text className="text-gray-700 mb-4">
                To ensure uninterrupted service and access to all features, please renew your subscription before the expiry date.
              </Text>
              <Section className="text-center my-8">
                <Button
                  href={renewalLink}
                  className="bg-blue-600 text-white py-3 px-6 rounded-md font-medium no-underline text-center"
                >
                  Renew Subscription
                </Button>
              </Section>
              <Text className="text-gray-700 mb-4">
                If your subscription expires, your organization will be downgraded to the Free plan with limited features and capacity.
              </Text>
              <Text className="text-gray-700 mb-4">
                If you have any questions or need assistance, please don&apos;t hesitate to contact our support team.
              </Text>
              <Text className="text-gray-700 mb-4">
                Thank you for using our service!
              </Text>

              <Text className="text-gray-500 text-sm text-center mt-8">
                © {new Date().getFullYear()} QR Check-in System. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
