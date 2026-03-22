import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function AuthPage(): React.ReactElement {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-card p-6">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-brand-surf p-1 text-sm">
          <button className="rounded-lg bg-brand-card px-3 py-2 font-medium">
            Sign Up
          </button>
          <button className="rounded-lg px-3 py-2 text-brand-sub">Sign In</button>
        </div>
        <div className="space-y-3">
          <button className="w-full rounded-xl border border-brand-border bg-brand-card2 px-4 py-2 text-sm">
            Continue with Google
          </button>
          <button className="w-full rounded-xl border border-brand-border bg-brand-card2 px-4 py-2 text-sm">
            Continue with GitHub
          </button>
          <div className="text-center text-xs text-brand-muted">or</div>
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border border-brand-border bg-brand-card2 px-3 py-2 text-sm outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-brand-border bg-brand-card2 px-3 py-2 text-sm outline-none"
          />
          <label className="flex items-center gap-2 text-xs text-brand-sub">
            <input type="checkbox" className="accent-brand-or" />
            I agree to Terms and Privacy Policy
          </label>
          <p className="text-xs text-brand-gr">100 free credits on signup</p>
          <button className="w-full rounded-xl bg-brand-gradient px-4 py-2 font-semibold text-white">
            Continue
          </button>
          <Link href="/" className="block text-center text-xs text-brand-sub underline">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
