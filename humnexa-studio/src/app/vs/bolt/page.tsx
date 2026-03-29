import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Humnexa Studio vs Bolt.new",
  description:
    "Compare Humnexa Studio with Bolt.new for Indian developers: INR pricing, UPI AutoPay, GST compliance, and India Stack templates.",
};

export default function VsBoltPage(): React.ReactElement {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-black">Humnexa Studio vs Bolt.new</h1>
      <p className="text-sm text-brand-sub">
        Bolt.new delivers fast browser-native dev environments. Humnexa Studio
        is optimized for India-first production SaaS with compliance and local
        payment rails.
      </p>
      <section className="rounded-2xl border border-brand-border bg-brand-card p-5">
        <h2 className="text-lg font-semibold">Why India builders choose Humnexa</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-brand-sub">
          <li>Predictable INR plans designed for student and indie budgets.</li>
          <li>Native Razorpay + UPI subscription and GST invoice workflows.</li>
          <li>DPDPA/CERT-In operational readiness and Indian legal templates.</li>
          <li>Built-in India Stack templates (GST, COD, WhatsApp, UPI).</li>
        </ul>
      </section>
    </main>
  );
}
