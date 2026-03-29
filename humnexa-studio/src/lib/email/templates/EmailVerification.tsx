import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type EmailVerificationProps = {
  customerName: string;
  otpCode?: string;
  verificationUrl?: string;
  expiresInMinutes: number;
};

export default function EmailVerification({
  customerName,
  otpCode,
  verificationUrl,
  expiresInMinutes,
}: EmailVerificationProps): React.ReactElement {
  return (
    <Html>
      <Head />
      <Preview>Verify your email</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Verify your email</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            Use the verification code below or click the verification link. This expires in{" "}
            {expiresInMinutes} minutes.
          </Text>
          {otpCode ? <Section style={otpBox}>{otpCode}</Section> : null}
          {verificationUrl ? (
            <Button href={verificationUrl} style={button}>
              Verify Email
            </Button>
          ) : null}
        </Container>
      </Body>
    </Html>
  );
}

const body = { backgroundColor: "#060810", color: "#E5E7EB", padding: "16px" };
const container = {
  border: "1px solid #1F2937",
  borderRadius: "16px",
  backgroundColor: "#0B1220",
  maxWidth: "520px",
  margin: "0 auto",
  padding: "24px",
};
const heading = { color: "#FF6B2C", margin: "0 0 12px", fontSize: "24px" };
const text = { fontSize: "14px", lineHeight: "22px" };
const otpBox = {
  fontSize: "28px",
  letterSpacing: "6px",
  fontWeight: "700",
  textAlign: "center" as const,
  padding: "16px",
  margin: "16px 0",
  borderRadius: "12px",
  border: "1px solid #374151",
  backgroundColor: "#111827",
};
const button = {
  display: "inline-block",
  borderRadius: "10px",
  backgroundColor: "#FF6B2C",
  color: "#ffffff",
  fontWeight: "700",
  padding: "10px 14px",
  textDecoration: "none",
};
