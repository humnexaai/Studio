import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/public/PublicPageShell";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Humnexa Studio refund policy aligned with RBI timelines and Indian consumer protection requirements.",
};

export default function RefundPolicyPage(): React.ReactElement {
  return (
    <PublicPageShell contentClassName="mx-auto w-full max-w-4xl px-4 py-10">
      <article className="rounded-2xl border border-brand-border bg-brand-card p-6 md:p-8">
        <h1 className="text-3xl font-black">Refund Policy</h1>
        <p className="mt-3 text-sm text-brand-sub">Effective date: 2026-03-29 • Version: 1.0</p>

        <section className="mt-6 space-y-3 text-sm text-brand-sub">
          <h2 className="text-lg font-semibold text-brand-text">1. Refund eligibility</h2>
          <p>
            First-time subscribers are eligible for a refund request within 7 days of the
            initial successful payment if the service is materially not as described.
          </p>
          <p>
            Credits already consumed for successful generations are non-refundable. Usage
            logs and credit transaction records are used to compute final refund eligibility.
          </p>
        </section>

        <section className="mt-6 space-y-3 text-sm text-brand-sub">
          <h2 className="text-lg font-semibold text-brand-text">2. How to request a refund</h2>
          <p>
            Send a request from your account email to{" "}
            <a className="text-brand-or underline" href="mailto:support@humnexa.com">
              support@humnexa.com
            </a>{" "}
            with payment reference, date, and reason. You will receive an acknowledgement and
            ticket number.
          </p>
        </section>

        <section className="mt-6 space-y-3 text-sm text-brand-sub">
          <h2 className="text-lg font-semibold text-brand-text">3. Processing timelines</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>UPI refunds: target processing within T+1 business day.</li>
            <li>Card refunds: target processing within T+5 business days.</li>
            <li>Refunds are issued to the original payment method (source refund only).</li>
          </ul>
        </section>

        <section className="mt-6 space-y-3 text-sm text-brand-sub">
          <h2 className="text-lg font-semibold text-brand-text">4. Partial refunds</h2>
          <p>
            Where applicable, partial refunds are calculated as:
          </p>
          <p className="rounded-lg border border-brand-border bg-brand-card2 px-3 py-2 font-mono text-xs">
            refundable_amount = amount_paid - value_of_consumed_credits - applicable_taxes_or_gateway_reversals
          </p>
        </section>

        <section className="mt-6 space-y-3 text-sm text-brand-sub">
          <h2 className="text-lg font-semibold text-brand-text">5. Escalation and consumer rights</h2>
          <p>
            If your refund is delayed beyond 7 business days, escalate to the Grievance
            Officer via{" "}
            <Link href="/grievance" className="text-brand-or underline">
              /grievance
            </Link>.
          </p>
          <p>
            You may further escalate unresolved disputes to the appropriate Consumer Forum
            under applicable Indian consumer protection laws.
          </p>
        </section>
      </article>
    </PublicPageShell>
  );
}
