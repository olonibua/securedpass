import {
  Body,
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

interface CheckInEmailTemplateProps {
  memberName: string;
  organizationName: string;
  checkInTime: string;
  organizationLogo?: string;
}

export const CheckInEmailTemplate = ({
  memberName,
  organizationName,
  checkInTime,
  organizationLogo,
}: CheckInEmailTemplateProps) => {
  const previewText = `Check-in confirmation for ${organizationName}`;

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
                Check-in Confirmation
              </Heading>
              
              <Text className="text-gray-700 mb-4">
                Hello {memberName},
              </Text>
              
              <Text className="text-gray-700 mb-4">
                This email confirms your check-in at <strong>{organizationName}</strong> on <strong>{checkInTime}</strong>.
              </Text>
              
              <Section className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
                <Text className="text-gray-700 m-0">
                  <strong>Organization:</strong> {organizationName}
                </Text>
                <Text className="text-gray-700 m-0">
                  <strong>Check-in Time:</strong> {checkInTime}
                </Text>
              </Section>
              
              <Text className="text-gray-700 mb-4">
                If you did not check in or have any questions, please contact the organization administrator.
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
