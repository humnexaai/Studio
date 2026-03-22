"use client";

import { useMemo } from "react";
import { useUserStore } from "@/store/userStore";

export function useCredits(): {
  credits: number;
  format: string;
  lowBalance: boolean;
} {
  const credits = useUserStore((state) => state.credits);

  return useMemo(
    () => ({
      credits,
      format: credits.toLocaleString("en-IN"),
      lowBalance: credits < 20,
    }),
    [credits],
  );
}
