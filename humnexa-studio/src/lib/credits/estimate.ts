export function estimateCredits(message: string, mode: "agent" | "plan"): number {
  if (mode === "plan") return 0;

  const normalized = message.trim().toLowerCase();
  if (normalized.includes("complete app") || normalized.includes("full application")) {
    return 10;
  }

  const length = normalized.length;
  if (length <= 50) return 1;
  if (length <= 160) return 1;
  if (length <= 400) return 3;
  if (length <= 900) return 5;
  return 8;
}
