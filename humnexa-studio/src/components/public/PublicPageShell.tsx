import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";

type PublicPageShellProps = {
  children: React.ReactNode;
  contentClassName?: string;
};

export function PublicPageShell({
  children,
  contentClassName,
}: PublicPageShellProps): React.ReactElement {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <PublicHeader />
      <main className={contentClassName ?? "mx-auto w-full max-w-6xl px-4 py-10 md:px-6"}>
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
