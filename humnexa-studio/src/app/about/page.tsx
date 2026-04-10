import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/public/PublicPageShell";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Humnexa Studio, our India-first product vision, and why we are building for developers and startups.",
};

const values = [
  {
    title: "India-first by design",
    description:
      "We build for Indian developers from day one: INR pricing, UPI payment rails, GST workflows, and local compliance support.",
  },
  {
    title: "Production quality over demos",
    description:
      "Our platform is focused on shipping real applications with secure backend defaults, robust workflows, and deploy-ready outputs.",
  },
  {
    title: "Access for every builder",
    description:
      "From students to startups, we keep powerful AI app-building tools affordable, practical, and easy to adopt.",
  },
];

export default function AboutPage(): React.ReactElement {
  return (
    <PublicPageShell contentClassName="mx-auto w-full max-w-5xl px-4 py-10">
      <section className="rounded-3xl border border-brand-border bg-brand-card p-6 md:p-8">
        <p className="inline-flex rounded-full border border-brand-or/40 bg-brand-or/10 px-3 py-1 text-xs text-brand-or">
          About Humnexa Studio
        </p>
        <h1 className="mt-4 font-display text-4xl font-black leading-tight md:text-5xl">
          Built in India for modern app builders
        </h1>
        <p className="mt-4 max-w-3xl text-sm text-brand-sub md:text-base">
          Humnexa Studio is an AI-powered app development platform by
          <strong> PLATINUMGOLD Partnership Firm</strong>. We help creators go
          from idea to launched product quickly while staying practical about
          pricing, compliance, and real-world shipping workflows.
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {values.map((value) => (
          <article
            key={value.title}
            className="rounded-2xl border border-brand-border bg-brand-card p-5"
          >
            <h2 className="text-lg font-semibold">{value.title}</h2>
            <p className="mt-2 text-sm text-brand-sub">{value.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-brand-border bg-brand-surf p-5">
        <h2 className="text-xl font-semibold">Important policy pages</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <Link className="rounded border border-brand-border px-3 py-1.5 text-brand-sub hover:text-brand-text" href="/privacy">
            Privacy Policy
          </Link>
          <Link className="rounded border border-brand-border px-3 py-1.5 text-brand-sub hover:text-brand-text" href="/terms">
            Terms of Service
          </Link>
          <Link className="rounded border border-brand-border px-3 py-1.5 text-brand-sub hover:text-brand-text" href="/refund">
            Refund Policy
          </Link>
          <Link className="rounded border border-brand-border px-3 py-1.5 text-brand-sub hover:text-brand-text" href="/grievance">
            Grievance Officer
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
