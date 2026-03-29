import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "DPDPA-ready privacy policy for Humnexa Studio.",
};

export default function PrivacyPage(): React.ReactElement {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-brand-sub">
        Effective Date: 2026-03-29 | Version: 1.0.0
      </p>

      <section className="mt-6 space-y-4 text-sm text-brand-sub">
        <p>
          Humnexa Studio is operated by <strong>PLATINUMGOLD Partnership Firm</strong>{" "}
          (Data Fiduciary), Mumbai, Maharashtra, India.
        </p>
        <h2 className="text-lg font-semibold text-brand-text">Data We Collect</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Account Data: name, email, auth identifiers.</li>
          <li>Payment Data: Razorpay IDs, billing amounts, GST fields.</li>
          <li>Usage Data: prompts, project metadata, logs, device/session information.</li>
          <li>Support Data: tickets, communications, grievance submissions.</li>
        </ul>

        <h2 className="text-lg font-semibold text-brand-text">Purpose of Processing</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Provide AI app-building services and secure account access.</li>
          <li>Process subscriptions, billing, GST invoicing, and refunds.</li>
          <li>Detect abuse, prevent fraud, and improve reliability/security.</li>
          <li>Send transactional emails and service notifications.</li>
        </ul>

        <h2 className="text-lg font-semibold text-brand-text">Consent and Withdrawal</h2>
        <p>
          Processing is based on your explicit consent. You may withdraw consent at any
          time by writing to the Grievance Officer, subject to legal retention obligations.
        </p>

        <h2 className="text-lg font-semibold text-brand-text">
          Data Principal Rights (DPDPA 2023)
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Right to access your personal data.</li>
          <li>Right to correction and completion.</li>
          <li>Right to erasure (subject to legal obligations).</li>
          <li>Right to grievance redressal.</li>
          <li>Right to nominate another person for rights exercise.</li>
        </ul>

        <h2 className="text-lg font-semibold text-brand-text">Grievance Officer</h2>
        <p>
          Name: <strong>Riya Sharma</strong>
          <br />
          Email: <strong>grievance@humnexa.com</strong>
          <br />
          Postal Address: PLATINUMGOLD Partnership Firm, Mumbai, Maharashtra, India.
        </p>
        <p>
          Complaints are acknowledged with a ticket number within 48 hours and resolved
          within 30 days.
        </p>

        <h2 className="text-lg font-semibold text-brand-text">Retention</h2>
        <p>
          Account and billing records are retained for statutory and audit requirements.
          Security and system logs are retained for at least 180 days in India.
        </p>

        <h2 className="text-lg font-semibold text-brand-text">Cross-Border Transfers</h2>
        <p>
          Data transfers may occur to jurisdictions not blacklisted by competent Indian
          authorities under applicable DPDPA notifications.
        </p>

        <h2 className="text-lg font-semibold text-brand-text">Breach Notification</h2>
        <p>
          Security incidents are assessed immediately and, where applicable, reported to
          CERT-In within 6 hours and notified to relevant authorities and affected users.
        </p>

        <h2 className="text-lg font-semibold text-brand-text">Children&apos;s Data</h2>
        <p>
          Users under 18 require verifiable parental consent. We may require government
          identity validation for parental authorization.
        </p>
      </section>
    </main>
  );
}
