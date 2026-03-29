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

type CreditsLowProps = {
  customerName: string;
  remainingCredits: number;
  upgradeUrl: string;
};

export default function CreditsLow({
  customerName,
  remainingCredits,
  upgradeUrl,
}: CreditsLowProps): React.ReactElement {
  return (
    <Html>
      <Head />
      <Preview>Your Humnexa credits are running low.</Preview>
      <Body style={{ backgroundColor: "#060810", margin: 0, fontFamily: "Arial, sans-serif" }}>
        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            padding: "24px",
            backgroundColor: "#0d1324",
            border: "1px solid #1f2937",
            borderRadius: "12px",
            color: "#f9fafb",
          }}
        >
          <Section style={{ textAlign: "center", marginBottom: "16px" }}>
            <Text
              style={{
                margin: 0,
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: "8px",
                backgroundColor: "#ff6b2c22",
                color: "#ff6b2c",
                fontWeight: 700,
              }}
            >
              H
            </Text>
          </Section>
          <Heading style={{ color: "#f9fafb", textAlign: "center" }}>
            Your credits are running low
          </Heading>
          <Text style={{ color: "#d1d5db" }}>
            Hi {customerName}, you currently have{" "}
            <strong>{remainingCredits.toLocaleString("en-IN")}</strong> credits left.
          </Text>
          <Text style={{ color: "#d1d5db" }}>
            Upgrade now to avoid interruptions while generating and deploying your apps.
          </Text>
          <Section style={{ textAlign: "center", marginTop: "18px" }}>
            <Button
              href={upgradeUrl}
              style={{
                backgroundColor: "#ff6b2c",
                color: "#ffffff",
                borderRadius: "8px",
                padding: "10px 16px",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Upgrade Plan
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
