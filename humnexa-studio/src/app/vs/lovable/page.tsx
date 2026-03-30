import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Humnexa Studio vs Lovable",
  description:
    "Compare Humnexa Studio and Lovable for India: INR pricing, UPI AutoPay, GST, Hindi mode, and India Stack templates.",
};

export default function VsLovablePage(): React.ReactElement {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-black">Humnexa Studio vs Lovable</h1>
      <p className="mt-2 text-sm text-brand-sub">
        Built for India-first shipping: predictable INR pricing, UPI subscriptions, and
        compliance-ready workflows.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-brand-border bg-brand-card p-5">
          <h2 className="text-lg font-semibold text-brand-or">Humnexa Studio</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-brand-sub">
            <li>Starts with India-friendly INR tiers including student plan (₹99).</li>
            <li>Razorpay + UPI AutoPay subscription flow.</li>
            <li>GST invoicing helpers and India Stack templates.</li>
            <li>Hindi mode and India-focused prompts.</li>
          </ul>
        </section>
        <section className="rounded-2xl border border-brand-border bg-brand-card p-5">
          <h2 className="text-lg font-semibold">Lovable</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-brand-sub">
            <li>Strong rapid prototyping for React web apps.</li>
            <li>Higher USD-centric pricing for Indian early builders.</li>
            <li>No India-native billing and tax defaults out of the box.</li>
          </ul>
        </section>
      </div>

      <div className="mt-8">
        <Link
          href="/auth"
          className="inline-flex rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white"
        >
          Try Humnexa Studio
        </Link>
      </div>
    </main>
  );
}
