import Link from "next/link";

const navItems = [
  { href: "/pricing", label: "Pricing" },
  { href: "/features", label: "Features" },
  { href: "/india", label: "India Stack" },
  { href: "/about", label: "About" },
  { href: "/student", label: "Student" },
  { href: "/status", label: "Status" },
];

export function PublicHeader(): React.ReactElement {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-border/80 bg-brand-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient font-display text-sm font-black text-white">
            H
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            Humnexa Studio
          </span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-brand-sub transition hover:text-brand-text"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/auth"
            className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-sub transition hover:text-brand-text md:text-sm"
          >
            Sign in
          </Link>
          <Link
            href="/auth"
            className="rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white md:text-sm"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
