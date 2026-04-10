import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/public/PublicPageShell";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore Humnexa Studio features: AI app generation, India Stack, billing, deployment, and collaboration.",
};

const features = [
  {
    title: "AI chat to application",
    description:
      "Turn prompts into working app code with file-level updates and planning modes.",
  },
  {
    title: "India Stack ready",
    description:
      "UPI subscriptions, GST invoice support, WhatsApp workflows, and compliance-focused defaults.",
  },
  {
    title: "Secure by default",
    description:
      "RLS-oriented Supabase setup, webhook idempotency, and security headers/rate limiting.",
  },
  {
    title: "Deploy and monitor",
    description:
      "One-click deployment workflows plus health status and analytics integration.",
  },
];

export default function FeaturesPage(): React.ReactElement {
  return (
    <PublicPageShell contentClassName="mx-auto w-full max-w-6xl px-4 py-10">
      <section className="rounded-3xl border border-brand-border bg-brand-card p-6 md:p-8">
        <h1 className="font-display text-4xl font-black md:text-5xl">
          Built to ship real products
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-brand-sub md:text-base">
          Humnexa Studio combines rapid AI generation with production-focused
          foundations so you can move from prototype to launch with confidence.
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-2xl border border-brand-border bg-brand-card p-5"
          >
            <h2 className="text-xl font-semibold">{feature.title}</h2>
            <p className="mt-2 text-sm text-brand-sub">{feature.description}</p>
          </article>
        ))}
      </section>

      <div className="mt-8 text-center">
        <Link
          href="/auth"
          className="inline-flex rounded-lg bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white"
        >
          Build your first app
        </Link>
      </div>
    </PublicPageShell>
  );
}
