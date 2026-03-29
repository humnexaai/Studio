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

type TrialEndingProps = {
  customerName: string;
  daysLeft: number;
  upgradeUrl: string;
};

export default function TrialEnding({
  customerName,
  daysLeft,
  upgradeUrl,
}: TrialEndingProps): React.ReactElement {
  return (
    <Html>
      <Head />
      <Preview>{`Your free trial ends in ${daysLeft} days`}</Preview>
      <Body style={{ backgroundColor: "#060810", color: "#E8E8EF", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "24px" }}>
          <Heading style={{ color: "#FF6B2C" }}>Your free trial ends in {daysLeft} days</Heading>
          <Text>Hello {customerName},</Text>
          <Text>
            Upgrade now to keep building with higher limits, deployment tools, collaboration, and Arena mode.
          </Text>
          <Section style={{ marginTop: "16px" }}>
            <Button
              href={upgradeUrl}
              style={{
                backgroundColor: "#FF6B2C",
                color: "#111111",
                borderRadius: "8px",
                padding: "12px 18px",
                fontWeight: 700,
                textDecoration: "none",
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
