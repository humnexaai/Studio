import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/public/PublicPageShell";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Transparent INR pricing for Humnexa Studio with plans for students, builders, and teams.",
};

const plans = [
  {
    name: "Free",
    price: "₹0",
    note: "Start building",
    features: ["100 credits", "Core studio access", "Public templates"],
  },
  {
    name: "Student",
    price: "₹99/mo",
    note: "Best for students",
    features: ["200 credits", "India Stack features", "Priority support queue"],
  },
  {
    name: "Starter",
    price: "₹199/mo",
    note: "For indie builders",
    features: ["500 credits", "Deployment workflows", "Team-ready foundations"],
  },
  {
    name: "Pro",
    price: "₹499/mo",
    note: "For growing products",
    features: ["2500 credits", "Advanced workflows", "Priority support"],
  },
];

export default function PricingPage(): React.ReactElement {
  return (
    <PublicPageShell contentClassName="mx-auto w-full max-w-6xl px-4 py-10">
      <section className="rounded-3xl border border-brand-border bg-brand-card p-6 text-center md:p-8">
        <h1 className="font-display text-4xl font-black md:text-5xl">Simple INR pricing</h1>
        <p className="mt-3 text-sm text-brand-sub md:text-base">
          Predictable plans designed for India-first builders and teams.
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className="rounded-2xl border border-brand-border bg-brand-card p-5"
          >
            <p className="text-sm text-brand-sub">{plan.note}</p>
            <h2 className="mt-2 text-2xl font-black">{plan.name}</h2>
            <p className="mt-1 text-lg font-semibold text-brand-or">{plan.price}</p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-brand-sub">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <div className="mt-8 text-center">
        <Link
          href="/auth"
          className="inline-flex rounded-lg bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white"
        >
          Start free
        </Link>
      </div>
    </PublicPageShell>
  );
}
