"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Logo } from "@/components/ui/Logo";
import { supabase } from "@/lib/supabase/client";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
});

type AuthFormValues = z.infer<typeof authSchema>;

type AuthTab = "signup" | "signin" | "reset";

export default function AuthPage(): React.ReactElement {
  const router = useRouter();
  const [tab, setTab] = useState<AuthTab>("signup");
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const oauthRedirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined;

  const handleOAuth = async (
    provider: "google" | "github",
  ): Promise<void> => {
    setAuthError(null);
    setStatusMessage(null);
    setOauthLoading(provider);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: oauthRedirectTo,
      },
    });

    if (error) {
      setAuthError(error.message);
      setOauthLoading(null);
      return;
    }
  };

  const onSubmit = async (values: AuthFormValues): Promise<void> => {
    setAuthError(null);
    setStatusMessage(null);
    setFormLoading(true);

    if (tab === "signup") {
      const signupResponse = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          honeypot,
          emailRedirectTo: oauthRedirectTo,
        }),
      });
      const signupPayload = (await signupResponse.json()) as { error?: string };

      if (!signupResponse.ok) {
        setAuthError(signupPayload.error ?? "Failed to create account");
        setFormLoading(false);
        return;
      }

      setStatusMessage("Check your email to confirm your account.");
      setFormLoading(false);
      return;
    }

    if (tab === "reset") {
      const resetResponse = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          honeypot,
        }),
      });
      const resetPayload = (await resetResponse.json()) as { error?: string };
      if (!resetResponse.ok) {
        setAuthError(resetPayload.error ?? "Failed to send reset email");
        setFormLoading(false);
        return;
      }

      setStatusMessage("Password reset link sent. Check your inbox.");
      setFormLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setAuthError(error.message);
      setFormLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-card p-6">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl bg-brand-surf p-1 text-sm">
          <button
            type="button"
            onClick={() => setTab("signup")}
            className={`rounded-lg px-3 py-2 ${tab === "signup" ? "bg-brand-card font-medium" : "text-brand-sub"}`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => setTab("signin")}
            className={`rounded-lg px-3 py-2 ${tab === "signin" ? "bg-brand-card font-medium" : "text-brand-sub"}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab("reset")}
            className={`rounded-lg px-3 py-2 ${tab === "reset" ? "bg-brand-card font-medium" : "text-brand-sub"}`}
          >
            Reset
          </button>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => void handleOAuth("google")}
            disabled={oauthLoading !== null}
            className="w-full rounded-xl border border-brand-border bg-brand-card2 px-4 py-2 text-sm disabled:opacity-60"
          >
            {oauthLoading === "google" ? "Redirecting..." : "Continue with Google"}
          </button>
          <button
            type="button"
            onClick={() => void handleOAuth("github")}
            disabled={oauthLoading !== null}
            className="w-full rounded-xl border border-brand-border bg-brand-card2 px-4 py-2 text-sm disabled:opacity-60"
          >
            {oauthLoading === "github" ? "Redirecting..." : "Continue with GitHub"}
          </button>
          <div className="text-center text-xs text-brand-muted">or</div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <input type="hidden" name="honeypot" value={honeypot} readOnly />
            <input
              type="text"
              name="company"
              value={honeypot}
              onChange={(event) => setHoneypot(event.target.value)}
              autoComplete="off"
              tabIndex={-1}
              className="hidden"
            />
            <div>
              <input
                type="email"
                placeholder="Email"
                className="w-full rounded-xl border border-brand-border bg-brand-card2 px-3 py-2 text-sm outline-none"
                {...register("email")}
              />
              {errors.email ? (
                <p className="mt-1 text-xs text-brand-error">{errors.email.message}</p>
              ) : null}
            </div>
            {tab !== "reset" ? (
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full rounded-xl border border-brand-border bg-brand-card2 px-3 py-2 text-sm outline-none"
                  {...register("password")}
                />
                {errors.password ? (
                  <p className="mt-1 text-xs text-brand-error">{errors.password.message}</p>
                ) : null}
              </div>
            ) : null}

            {tab !== "reset" ? (
              <>
                <label className="flex items-center gap-2 text-xs text-brand-sub">
                  <input type="checkbox" className="accent-brand-or" required />
                  I agree to Terms and Privacy Policy
                </label>
                <p className="text-xs text-brand-gr">100 free credits on signup</p>
              </>
            ) : null}

            {authError ? (
              <p className="text-sm text-brand-error">{authError}</p>
            ) : null}
            {statusMessage ? (
              <p className="text-sm text-brand-gr">{statusMessage}</p>
            ) : null}

            <button
              type="submit"
              onClick={(event) => {
                if (honeypot.trim()) {
                  event.preventDefault();
                  setAuthError("Suspicious activity detected.");
                }
              }}
              disabled={formLoading}
              className="w-full rounded-xl bg-brand-gradient px-4 py-2 font-semibold text-white disabled:opacity-60"
            >
              {formLoading
                ? "Please wait..."
                : tab === "signup"
                  ? "Create account"
                  : tab === "reset"
                    ? "Send reset link"
                    : "Sign in"}
            </button>
          </form>

          <Link href="/" className="block text-center text-xs text-brand-sub underline">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
