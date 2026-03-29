import { describe, expect, it } from "vitest";
import { estimateCredits } from "@/lib/credits/estimate";

describe("estimateCredits", () => {
  it("returns 0 for plan mode", () => {
    expect(estimateCredits("build app", "plan")).toBe(0);
  });

  it("returns 1 for simple message under 50 chars", () => {
    expect(estimateCredits("Create navbar", "agent")).toBe(1);
  });

  it("returns 10 for message containing complete app", () => {
    expect(estimateCredits("Build complete app with auth and payments", "agent")).toBe(10);
  });

  it("returns 10 for message containing full application", () => {
    expect(estimateCredits("Generate full application with dashboard", "agent")).toBe(10);
  });
});
