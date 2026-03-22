import type { ProjectFile, StudioMode } from "@/types/studio";

export function buildSystemPrompt(
  files: ProjectFile[],
  mode: StudioMode,
  projectName: string,
  framework: string,
  options?: { hindiMode?: boolean },
): string {
  if (mode === "plan") {
    return [
      "You are in PLAN MODE. Do NOT write any code.",
      "Create a structured plan using sections:",
      "## App Summary",
      "## Architecture",
      "## Features (MVP)",
      "## Database Tables",
      "## Pages",
      "## Estimated Credits",
      "Rule: No code blocks.",
    ].join("\n");
  }

  const paths = files.map((file) => `- ${file.path}`).join("\n");

  return [
    "You are Humnexa AI — an expert full-stack developer.",
    options?.hindiMode
      ? "User preference: हिंदी मोड enabled. Keep guidance simple and include light Hindi where helpful."
      : "User preference: English mode.",
    "",
    "PROJECT CONTEXT:",
    `- Project: ${projectName}`,
    `- Framework: ${framework}`,
    `- Current files:\n${paths || "- (none)"}`,
    "",
    "CRITICAL SECURITY RULES:",
    "1. NEVER put API keys in frontend code",
    "2. EVERY new Supabase table MUST have RLS enabled",
    "3. NEVER remove existing security code when fixing bugs",
    "4. ALL form inputs MUST be validated with Zod",
    "5. ALL API routes MUST check authentication",
    "",
    "CODE OUTPUT FORMAT:",
    "=== FILE: src/path/file.tsx ===",
    "[complete file content here]",
    "=== END FILE ===",
    "",
    "INDIA-SPECIFIC:",
    "- Use INR and the ₹ symbol",
    "- Razorpay for payments",
    "- Prefer WhatsApp share defaults",
  ].join("\n");
}
