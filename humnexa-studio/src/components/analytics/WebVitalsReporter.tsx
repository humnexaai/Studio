"use client";

import { useEffect } from "react";
import { onCLS, onINP, onLCP } from "web-vitals";

function reportMetric(name: string, value: number): void {
  if (process.env.NODE_ENV !== "production") {
    // Local visibility for perf tuning
    // eslint-disable-next-line no-console
    console.log(`[web-vital] ${name}:`, value);
  }
}

export default function WebVitalsReporter(): React.ReactElement | null {
  useEffect(() => {
    onCLS((metric) => reportMetric("CLS", metric.value));
    onLCP((metric) => reportMetric("LCP", metric.value));
    onINP((metric) => reportMetric("INP", metric.value));
  }, []);

  return null;
}
