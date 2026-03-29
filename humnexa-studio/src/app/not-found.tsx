import Link from "next/link";

export default function NotFound(): React.ReactElement {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-card p-6 text-center">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand-or/20 text-2xl font-black text-brand-or">
          H
        </div>
        <h1 className="text-3xl font-black text-brand-text">404</h1>
        <p className="mt-2 text-sm text-brand-sub">Page not found</p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white"
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}
