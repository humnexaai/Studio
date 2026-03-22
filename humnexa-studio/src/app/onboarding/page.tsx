"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const categories = [
  "E-Commerce",
  "Education",
  "Portfolio",
  "Mobile",
  "Business",
  "Other",
];

const preferences = ["Just chat", "Chat + Code", "Full control"];

export default function OnboardingPage(): React.ReactElement {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<string>("Business");
  const [preference, setPreference] = useState<string>("Chat + Code");

  const credits = useMemo(() => Math.min(step * 34, 100), [step]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-8 px-6 py-10">
      <header className="text-center">
        <h1 className="font-display text-4xl font-black">Welcome to Humnexa</h1>
        <p className="mt-2 text-brand-sub">
          Set up your workspace in 3 simple steps.
        </p>
      </header>

      <section className="rounded-2xl border border-brand-border bg-brand-card p-6">
        {step === 1 && (
          <div className="space-y-4 text-center">
            <p className="text-brand-sub">Your free credits are ready.</p>
            <motion.p
              className="font-display text-5xl font-extrabold text-brand-or"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {credits} credits
            </motion.p>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold">Choose your category</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left transition",
                    category === item
                      ? "border-brand-or bg-brand-or/10 text-brand-text"
                      : "border-brand-border bg-brand-card2 text-brand-sub"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold">Pick your style</h2>
            <div className="grid gap-3">
              {preferences.map((item) => (
                <button
                  key={item}
                  onClick={() => setPreference(item)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left transition",
                    preference === item
                      ? "border-brand-gr bg-brand-gr/10 text-brand-text"
                      : "border-brand-border bg-brand-card2 text-brand-sub"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((dot) => (
              <span
                key={dot}
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  dot <= step ? "bg-brand-or" : "bg-brand-border"
                )}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep((v) => Math.max(v - 1, 1))}
              className="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-sub"
            >
              Back
            </button>
            <button
              onClick={() => setStep((v) => Math.min(v + 1, 3))}
              className="rounded-lg bg-brand-gradient px-3 py-2 text-sm font-semibold text-white"
            >
              {step === 3 ? "Finish" : "Continue"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
