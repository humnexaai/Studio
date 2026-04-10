import type { Metadata } from "next";
import { PublicPageShell } from "@/components/public/PublicPageShell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Humnexa Studio under Indian law.",
};

export default function TermsPage(): React.ReactElement {
  return (
    <PublicPageShell contentClassName="mx-auto w-full max-w-4xl space-y-6 px-4 py-10 text-brand-text">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-sm text-brand-sub">
        Effective Date: 2026-03-29 | Version: 1.0
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">1. Company Identity</h2>
        <p>
          Humnexa Studio is operated by PLATINUMGOLD Partnership Firm, India
          (the &quot;Firm&quot;, &quot;we&quot;, &quot;us&quot;). Registration and business details are
          available on request via the Grievance Officer.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">2. Service Description</h2>
        <p>
          Humnexa Studio provides an AI app-building platform including chat,
          code generation, templates, deployment workflows, and team
          collaboration features.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">3. Account Registration</h2>
        <p>
          You must provide accurate registration details, keep credentials
          secure, and notify us of unauthorized access. You are responsible for
          all activity under your account.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">4. Acceptable Use Policy</h2>
        <p>Prohibited activities include:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Illegal, fraudulent, abusive, or harmful content.</li>
          <li>Malware, phishing, credential theft, or security evasion.</li>
          <li>Infringing IP rights of third parties.</li>
          <li>Attempts to bypass rate limits, billing, or access controls.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">5. Credits and Billing Rules</h2>
        <p>
          Credits are deducted only for successful AI operations. Failed
          generations are eligible for automated or manual credit refund.
          Billing and payment are handled through approved payment rails,
          including Razorpay where applicable.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">6. Intellectual Property</h2>
        <p>
          You retain ownership of code and content generated for your projects,
          subject to third-party licenses and lawful usage obligations.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">7. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, our aggregate liability is
          capped at fees paid by you in the 12 months preceding the claim.
          Nothing excludes liability where limitation is prohibited by Indian
          law.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">8. Dispute Resolution</h2>
        <p>
          Disputes shall be resolved by arbitration under the Arbitration and
          Conciliation Act, 1996. Seat of arbitration: India. Governing law:
          laws of India. Courts in India retain jurisdiction for interim and
          enforceable relief.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">9. Termination and Data Export</h2>
        <p>
          You may terminate your account at any time. We may suspend or
          terminate for material breach or legal compliance. Export requests are
          supported subject to retention, security, and legal obligations.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">10. CERT-In and Legal Compliance</h2>
        <p>
          Users must comply with applicable cyber and data laws. Security
          incidents may be reported and handled under CERT-In obligations.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">11. Modifications</h2>
        <p>
          We provide at least 30 days notice for material changes to these
          Terms, unless immediate updates are required by law or security.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">12. Grievance Officer</h2>
        <p>
          Name: Compliance Officer (Interim), PLATINUMGOLD Partnership Firm
          <br />
          Email: grievance@humnexa.com
          <br />
          Postal: Mumbai, Maharashtra, India
        </p>
      </section>
    </PublicPageShell>
  );
}
