import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/public/PublicPageShell";

export const metadata: Metadata = {
  title: "Student Plan",
  description:
    "Student pricing for Humnexa Studio at ₹99/month with verification.",
};

export default function StudentPage(): React.ReactElement {
  return (
    <PublicPageShell contentClassName="mx-auto w-full max-w-4xl px-4 py-10">
      <article className="rounded-2xl border border-brand-border bg-brand-card p-6 md:p-8">
        <h1 className="text-3xl font-black">Student Plan — ₹99/month</h1>
        <p className="mt-3 text-sm text-brand-sub">
          Built for India&apos;s student builders. Get affordable credits and core
          AI app building features with verified student status.
        </p>

        <section className="mt-6 space-y-3 text-sm text-brand-sub">
          <h2 className="text-lg font-semibold text-brand-text">What you get</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>200 credits per month</li>
            <li>Access to plan/build workflows</li>
            <li>Studio, templates, and deploy support</li>
            <li>India-first payment support (UPI via Razorpay)</li>
          </ul>
        </section>

        <section className="mt-6 space-y-3 text-sm text-brand-sub">
          <h2 className="text-lg font-semibold text-brand-text">
            Verification required
          </h2>
          <p>
            You must verify active student status using a valid institutional
            email or student ID during onboarding/review.
          </p>
        </section>

        <div className="mt-6">
          <Link
            href="/billing"
            className="inline-flex rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white"
          >
            Continue to Billing
          </Link>
        </div>
      </article>
    </PublicPageShell>
  );
}
