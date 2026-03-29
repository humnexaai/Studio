import { Resend } from "resend";
import type { ReactElement } from "react";
import WelcomeEmail from "@/lib/email/templates/WelcomeEmail";
import EmailVerification from "@/lib/email/templates/EmailVerification";
import PaymentSuccess from "@/lib/email/templates/PaymentSuccess";
import PaymentFailed from "@/lib/email/templates/PaymentFailed";
import CreditsLow from "@/lib/email/templates/CreditsLow";
import TrialEnding from "@/lib/email/templates/TrialEnding";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM_EMAIL ?? "Humnexa <no-reply@humnexa.com>";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

async function safeSend(options: {
  to: string;
  subject: string;
  react: ReactElement;
}): Promise<void> {
  if (!resend) return;
  await resend.emails.send({
    from: resendFrom,
    to: options.to,
    subject: options.subject,
    react: options.react,
  });
}

export async function sendWelcomeEmail(input: {
  to: string;
  customerName: string;
  appUrl: string;
}): Promise<void> {
  const createProjectUrl = `${input.appUrl}/dashboard`;
  const docsUrl = `${input.appUrl}/india`;
  await safeSend({
    to: input.to,
    subject: "Welcome to Humnexa Studio",
    react: WelcomeEmail({
      customerName: input.customerName,
      createProjectUrl,
      docsUrl,
    }),
  });
}

export async function sendEmailVerification(input: {
  to: string;
  customerName: string;
  otpCode?: string;
  verificationUrl?: string;
  expiresInMinutes: number;
}): Promise<void> {
  await safeSend({
    to: input.to,
    subject: "Verify your email",
    react: EmailVerification(input),
  });
}

export async function sendPaymentSuccessEmail(input: {
  to: string;
  customerName: string;
  amountInr: number;
  planName: string;
  creditsAdded: number;
  gst: {
    gstin: string;
    sacCode: string;
    taxableAmount: number;
  };
}): Promise<void> {
  await safeSend({
    to: input.to,
    subject: "Payment confirmed - receipt inside",
    react: PaymentSuccess(input),
  });
}

export async function sendPaymentFailedEmail(input: {
  to: string;
  customerName: string;
  reason: string;
  retryUrl?: string;
}): Promise<void> {
  await safeSend({
    to: input.to,
    subject: "Payment failed - action needed",
    react: PaymentFailed(input),
  });
}

export async function sendCreditsLowEmail(input: {
  to: string;
  customerName: string;
  remainingCredits: number;
  upgradeUrl: string;
}): Promise<void> {
  await safeSend({
    to: input.to,
    subject: "Your credits are running low",
    react: CreditsLow(input),
  });
}

export async function sendTrialEndingEmail(input: {
  to: string;
  customerName: string;
  daysLeft: number;
  upgradeUrl: string;
}): Promise<void> {
  await safeSend({
    to: input.to,
    subject: "Your free trial ends in 3 days",
    react: TrialEnding(input),
  });
}
