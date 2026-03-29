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

type PaymentSuccessProps = {
  customerName: string;
  amountInr: number;
  planName: string;
  creditsAdded: number;
  gst: {
    gstin: string;
    sacCode: string;
    taxableAmount: number;
  };
};

export default function PaymentSuccess({
  customerName,
  amountInr,
  planName,
  creditsAdded,
  gst,
}: PaymentSuccessProps): React.ReactElement {
  const cgst = Number((gst.taxableAmount * 0.09).toFixed(2));
  const sgst = Number((gst.taxableAmount * 0.09).toFixed(2));
  const total = Number((gst.taxableAmount + cgst + sgst).toFixed(2));

  return (
    <Html>
      <Head />
      <Preview>Payment confirmed - receipt inside</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={logoWrap}>
            <Text style={logo}>H</Text>
          </Section>
          <Heading style={heading}>Payment confirmed</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            Your payment of <strong>₹{amountInr.toLocaleString("en-IN")}</strong> was successful.
            <br />
            Plan activated: <strong>{planName}</strong>
            <br />
            Credits added: <strong>{creditsAdded}</strong>
          </Text>

          <Section style={invoice}>
            <Heading as="h3" style={invoiceTitle}>
              GST Invoice Summary
            </Heading>
            <Text style={invoiceText}>GSTIN: {gst.gstin}</Text>
            <Text style={invoiceText}>SAC Code: {gst.sacCode}</Text>
            <Text style={invoiceText}>
              Taxable Amount: ₹{gst.taxableAmount.toLocaleString("en-IN")}
            </Text>
            <Text style={invoiceText}>CGST (9%): ₹{cgst.toLocaleString("en-IN")}</Text>
            <Text style={invoiceText}>SGST (9%): ₹{sgst.toLocaleString("en-IN")}</Text>
            <Text style={invoiceText}>Total: ₹{total.toLocaleString("en-IN")}</Text>
          </Section>

          <Button
            href={`${process.env.NEXT_PUBLIC_APP_URL ?? "https://studio.humnexa.com"}/billing`}
            style={button}
          >
            View Billing
          </Button>
        </Container>
      </Body>
    </Html>
  );
}

const body = { backgroundColor: "#060810", color: "#E6ECFF", fontFamily: "Arial, sans-serif", margin: 0, padding: "24px 0" };
const container = {
  margin: "0 auto",
  maxWidth: "560px",
  padding: "24px",
  border: "1px solid #22304b",
  borderRadius: "12px",
  backgroundColor: "#0b1220",
};
const logoWrap = { textAlign: "center" as const, marginBottom: "8px" };
const logo = { margin: 0, color: "#FF6B2C", fontSize: "30px", fontWeight: 800 };
const heading = { color: "#FF6B2C", marginTop: 0 };
const text = { color: "#E6ECFF", fontSize: "14px", lineHeight: "22px" };
const invoice = {
  background: "#0d1324",
  padding: "12px",
  borderRadius: "10px",
  margin: "12px 0",
  border: "1px solid #1f2937",
};
const invoiceTitle = { fontSize: "16px", margin: "0 0 8px 0", color: "#f8fafc" };
const invoiceText = { margin: "4px 0", color: "#dbe3ff" };
const button = {
  backgroundColor: "#FF6B2C",
  color: "#060810",
  padding: "10px 14px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: 700,
};
