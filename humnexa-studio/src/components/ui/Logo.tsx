import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  compact?: boolean;
  href?: string;
  className?: string;
};

export function Logo({
  compact = false,
  href = "/",
  className,
}: LogoProps): React.ReactElement {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-brand-border bg-brand-surf px-3 py-2",
        className,
      )}
    >
      <span className="font-display rounded-md bg-brand-gradient px-2 py-1 text-xs font-black text-white">
        H
      </span>
      {!compact && (
        <span className="font-display text-sm font-extrabold tracking-wide">
          Humnexa Studio
        </span>
      )}
    </Link>
  );
}
