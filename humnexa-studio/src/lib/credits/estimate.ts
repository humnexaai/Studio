export function estimateCredits(message: string, mode: "agent" | "plan"): number {
  if (mode === "plan") return 0;
  const length = message.trim().length;
  if (length <= 160) return 1;
  if (length <= 400) return 3;
  if (length <= 900) return 5;
  return 8;
}
