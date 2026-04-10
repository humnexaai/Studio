import type { Metadata } from "next";
import { PublicPageShell } from "@/components/public/PublicPageShell";

export const metadata: Metadata = {
  title: "Grievance Officer",
  description:
    "Grievance redressal details for Humnexa Studio users in India.",
};

export default function GrievancePage(): React.ReactElement {
  return (
    <PublicPageShell contentClassName="mx-auto w-full max-w-3xl px-6 py-10">
      <article className="rounded-2xl border border-brand-border bg-brand-card p-6">
        <h1 className="font-display text-3xl font-extrabold">Grievance Officer</h1>
        <p className="mt-2 text-sm text-brand-sub">
          In line with Indian legal requirements, grievances are acknowledged
          with a ticket number within 48 hours and resolved within 30 days.
        </p>

        <div className="mt-6 space-y-3 rounded-xl border border-brand-border bg-brand-card2 p-4 text-sm">
          <p>
            <strong>Name:</strong> Aditi Sharma
          </p>
          <p>
            <strong>Email:</strong> grievance@humnexa.com
          </p>
          <p>
            <strong>Postal Address:</strong> Grievance Officer, PLATINUMGOLD
            Partnership Firm, 3rd Floor, Orion Business Hub, Andheri East,
            Mumbai, Maharashtra 400069, India.
          </p>
        </div>
      </article>
    </PublicPageShell>
  );
}
