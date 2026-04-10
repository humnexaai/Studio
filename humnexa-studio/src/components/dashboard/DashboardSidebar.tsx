"use client";

import Link from "next/link";
import { CreditBar } from "@/components/ui/CreditBar";
import { Logo } from "@/components/ui/Logo";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";

const navItems = [
  { href: "/dashboard", label: "Projects" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/billing", label: "Credits" },
  { href: "/dashboard/team", label: "Team" },
  { href: "/settings", label: "Settings" },
  { href: "/about", label: "About" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refund", label: "Refund" },
  { href: "/grievance", label: "Grievance" },
];

type DashboardSidebarProps = {
  userId: string;
  creditBalance: number;
  planLimit: number;
};

export function DashboardSidebar({
  userId,
  creditBalance,
  planLimit,
}: DashboardSidebarProps): React.ReactElement {
  return (
    <aside className="flex h-full w-[220px] flex-col border-r border-brand-border bg-brand-surf p-4 md:h-screen">
      <div className="flex items-center justify-between">
        <Logo />
        <NotificationsBell userId={userId} compact />
      </div>
      <nav className="mt-6 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-lg px-3 py-2 text-sm text-brand-sub transition hover:bg-brand-card hover:text-brand-text"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto rounded-xl border border-brand-border bg-brand-card p-3">
        <CreditBar userId={userId} balance={creditBalance} cap={planLimit} />
        <Link
          href="/billing"
          className="mt-3 block w-full rounded-lg bg-brand-gradient px-3 py-2 text-center text-sm font-semibold text-white"
        >
          Upgrade
        </Link>
      </div>
    </aside>
  );
}
