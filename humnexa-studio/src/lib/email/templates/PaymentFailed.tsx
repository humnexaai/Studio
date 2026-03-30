import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type PaymentFailedEmailProps = {
  customerName: string;
  reason: string;
  retryUrl?: string;
};

export default function PaymentFailedEmail({
  customerName,
  reason,
  retryUrl = "https://studio.humnexa.com/billing",
}: PaymentFailedEmailProps): React.ReactElement {
  return (
    <Html>
      <Head />
      <Preview>Payment failed - action needed</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={logoWrap}>
            <Text style={logo}>H</Text>
          </Section>
          <Heading style={heading}>Payment failed - action needed</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            We could not process your recent payment. Reason: <strong>{reason}</strong>
          </Text>
          <Section style={ctaWrap}>
            <Button style={button} href={retryUrl}>
              Retry payment
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={muted}>Humnexa Studio Billing Team</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = { backgroundColor: "#060810", margin: 0, padding: "24px 0" };
const container = {
  backgroundColor: "#0F162B",
  border: "1px solid #1F2A44",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "24px",
};
const logoWrap = { textAlign: "center" as const };
const logo = {
  color: "#FF6B2C",
  display: "inline-block",
  fontSize: "28px",
  fontWeight: 900,
  margin: "0 0 12px",
};
const heading = { color: "#FFFFFF", fontSize: "22px", margin: "0 0 10px" };
const text = { color: "#D2D8E2", fontSize: "14px", lineHeight: "22px" };
const ctaWrap = { marginTop: "16px", marginBottom: "16px" };
const button = {
  backgroundColor: "#FF6B2C",
  borderRadius: "8px",
  color: "#FFFFFF",
  fontSize: "14px",
  padding: "10px 16px",
  textDecoration: "none",
};
const hr = { borderColor: "#1F2A44", margin: "16px 0" };
const muted = { color: "#8C98AD", fontSize: "12px" };
