import Link from "next/link";

const productLinks = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/features", label: "Features" },
  { href: "/india", label: "India Stack" },
  { href: "/student", label: "Student Plan" },
  { href: "/vs/lovable", label: "Vs Lovable" },
  { href: "/vs/bolt", label: "Vs Bolt" },
];

const companyLinks = [
  { href: "/about", label: "About Us" },
  { href: "/status", label: "Status" },
  { href: "/auth", label: "Get Started" },
];

const legalLinks = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refund", label: "Refund Policy" },
  { href: "/grievance", label: "Grievance Officer" },
];

export function PublicFooter(): React.ReactElement {
  return (
    <footer className="border-t border-brand-border bg-brand-surf/80">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:grid-cols-4 md:px-6">
        <div>
          <p className="font-display text-lg font-bold">Humnexa Studio</p>
          <p className="mt-2 text-sm text-brand-sub">
            Idea → App → Launch → Earn. India-first AI app building with secure
            payments, GST workflows, and production-grade foundations.
          </p>
        </div>

        <FooterColumn title="Product" links={productLinks} />
        <FooterColumn title="Company" links={companyLinks} />
        <FooterColumn title="Legal" links={legalLinks} />
      </div>
      <div className="border-t border-brand-border/80 px-4 py-4 text-center text-xs text-brand-muted md:px-6">
        © {new Date().getFullYear()} Humnexa Studio · PLATINUMGOLD Partnership
        Firm
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}): React.ReactElement {
  return (
    <div>
      <p className="text-sm font-semibold text-brand-text">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-brand-sub transition hover:text-brand-or"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
