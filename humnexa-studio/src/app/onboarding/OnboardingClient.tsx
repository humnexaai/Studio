"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

const categories = [
  "E-Commerce",
  "Education",
  "Portfolio",
  "Mobile App",
  "Business",
  "Other",
];

const preferences = ["Just chat", "Chat + Review code", "Full control"];

export default function OnboardingClient(): React.ReactElement {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState("Builder");
  const [credits, setCredits] = useState(0);
  const [category, setCategory] = useState<string | null>(null);
  const [preference, setPreference] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async (): Promise<void> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      const typedProfile = profile as { full_name?: string | null } | null;
      if (typedProfile?.full_name) {
        setUserName(typedProfile.full_name);
      }

      const { data: settings } = await supabase
        .from("user_settings")
        .select("app_category, work_preference")
        .eq("id", user.id)
        .maybeSingle();
      const typedSettings = settings as
        | { app_category?: string | null; work_preference?: string | null }
        | null;

      setCategory(typedSettings?.app_category ?? null);
      setPreference(typedSettings?.work_preference ?? null);
    };

    void run();
  }, [router]);

  useEffect(() => {
    if (step !== 1) return;
    setCredits(0);
    const timer = setInterval(() => {
      setCredits((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    return () => clearInterval(timer);
  }, [step]);

  const saveSetting = async (
    values: Partial<{ app_category: string; work_preference: string }>,
  ): Promise<boolean> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/auth");
      return false;
    }

    const db = supabase as unknown as {
      from: (table: string) => {
        update: (payload: Record<string, unknown>) => {
          eq: (column: string, value: string) => Promise<{
            error: { message?: string } | null;
          }>;
        };
      };
    };
    const { error: updateError } = await db
      .from("user_settings")
      .update(values as Record<string, unknown>)
      .eq("id", user.id);
    if (updateError) {
      setError(updateError.message ?? "Unable to save preference");
      return false;
    }
    return true;
  };

  const handleCategoryPick = async (value: string): Promise<void> => {
    setCategory(value);
    setError(null);
    await saveSetting({ app_category: value });
  };

  const handlePreferencePick = async (value: string): Promise<void> => {
    setPreference(value);
    setError(null);
    await saveSetting({ work_preference: value });
  };

  const finishOnboarding = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/auth");
      return;
    }

    if (!preference) {
      setError("Please select your work preference.");
      setLoading(false);
      return;
    }

    const db = supabase as unknown as {
      from: (table: string) => {
        update: (payload: Record<string, unknown>) => {
          eq: (column: string, value: string) => Promise<{
            error: { message?: string } | null;
          }>;
        };
      };
    };
    const { error: profileError } = await db
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id);

    if (profileError) {
      setError(profileError.message ?? "Failed to complete onboarding.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-8 px-6 py-10">
      <header className="text-center">
        <h1 className="font-display text-4xl font-black">
          Welcome, {userName || "Builder"}
        </h1>
        <p className="mt-2 text-brand-sub">
          Set up your workspace in 3 simple steps.
        </p>
      </header>

      <section className="rounded-2xl border border-brand-border bg-brand-card p-6">
        {step === 1 ? (
          <div className="space-y-4 text-center">
            <p className="text-brand-sub">Your free credits are ready.</p>
            <p className="font-display text-5xl font-extrabold text-brand-or">
              {credits}
            </p>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-lg bg-brand-gradient px-4 py-2 font-semibold text-white"
            >
              Let&apos;s go →
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <h2 className="mb-4 text-lg font-semibold">Choose your category</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => void handleCategoryPick(item)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left transition",
                    category === item
                      ? "border-brand-or bg-brand-or/10 text-brand-text"
                      : "border-brand-border bg-brand-card2 text-brand-sub",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-lg bg-brand-gradient px-4 py-2 font-semibold text-white"
                disabled={!category}
              >
                Continue
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <h2 className="mb-4 text-lg font-semibold">Pick your style</h2>
            <div className="grid gap-3">
              {preferences.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => void handlePreferencePick(item)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left transition",
                    preference === item
                      ? "border-brand-or bg-brand-or/10 text-brand-text"
                      : "border-brand-border bg-brand-card2 text-brand-sub",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => void finishOnboarding()}
                disabled={loading}
                className="rounded-lg bg-brand-gradient px-4 py-2 font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Please wait..." : "Start Building 🚀"}
              </button>
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-brand-error">{error}</p> : null}

        <div className="mt-6 flex items-center gap-2">
          {[1, 2, 3].map((dot) => (
            <span
              key={dot}
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                dot <= step ? "bg-brand-or" : "bg-brand-border",
              )}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
