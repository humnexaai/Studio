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

type WelcomeEmailProps = {
  customerName: string;
  createProjectUrl: string;
  docsUrl: string;
};

export default function WelcomeEmail({
  customerName,
  createProjectUrl,
  docsUrl,
}: WelcomeEmailProps): React.ReactElement {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Humnexa Studio</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={{ textAlign: "center", marginBottom: "16px" }}>
            <Text style={logo}>H</Text>
            <Heading style={heading}>Welcome to Humnexa Studio</Heading>
          </Section>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            Welcome aboard. Start building your first AI-powered app in minutes.
          </Text>
          <Section style={{ textAlign: "center", marginTop: "18px", marginBottom: "18px" }}>
            <Button href={createProjectUrl} style={button}>
              Create your first project
            </Button>
          </Section>
          <Text style={text}>
            Documentation: {docsUrl}
            <br />
            Billing and plans: {createProjectUrl.replace("/dashboard", "/billing")}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = { backgroundColor: "#060810", margin: 0, padding: "24px 0" };
const container = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "24px",
  border: "1px solid #1f2937",
  borderRadius: "14px",
  backgroundColor: "#0b1220",
};
const logo = {
  margin: 0,
  fontSize: "30px",
  fontWeight: 800,
  color: "#FF6B2C",
};
const heading = { margin: "8px 0 0", color: "#f8fafc" };
const text = { color: "#d1d5db", fontSize: "14px", lineHeight: "22px" };
const button = {
  backgroundColor: "#FF6B2C",
  color: "#0b1220",
  textDecoration: "none",
  padding: "12px 18px",
  borderRadius: "10px",
  fontWeight: 700,
};
