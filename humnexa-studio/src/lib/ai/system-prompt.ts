import type { ProjectFile, StudioMode } from "@/types/studio";

type PromptOptions = {
  hindiMode?: boolean;
  projectInstructions?: string | null;
  workspaceKnowledge?: string | null;
};

function frameworkSpecificInstructions(framework: string): string[] {
  const normalized = framework.toLowerCase();

  if (normalized === "nextjs") {
    return [
      "Next.js generation rules:",
      "- Generate App Router compatible Next.js 14+ code.",
      "- Prefer server components for data-fetching pages unless client state is required.",
      "- Keep API logic in route handlers under src/app/api.",
      "- Use TypeScript and production-ready folder structure.",
    ];
  }

  if (normalized === "react") {
    return [
      "React generation rules:",
      "- Generate React application code with reusable components.",
      "- Keep state logic clean and minimize unnecessary re-renders.",
      "- Use TypeScript for components, hooks, and utilities.",
    ];
  }

  if (normalized === "vue") {
    return [
      "Vue generation rules:",
      "- Generate Vue 3 compatible code with SFC conventions.",
      "- Keep components modular and props/events clearly typed where possible.",
      "- Follow composition-api friendly patterns.",
    ];
  }

  if (normalized === "python") {
    return [
      "Python generation rules:",
      "- Generate idiomatic Python project structure and modules.",
      "- Include dependency and entry-point guidance (requirements.txt and run command) when relevant.",
      "- Keep code production-oriented with clear separation of concerns.",
    ];
  }

  if (normalized === "react-native") {
    return [
      "React Native / Expo generation rules:",
      "- Generate React Native + Expo code, never Next.js web pages.",
      "- Include app.json with app name and slug.",
      "- Include App.tsx as the main entry point.",
      "- Use src/screens and src/components folders.",
      "- Include package.json with expo and react-native dependencies.",
      "- Prefer mobile-first UI patterns and touch-friendly components.",
    ];
  }

  if (normalized === "flutter") {
    return [
      "Flutter generation rules:",
      "- Generate Flutter/Dart project files, never React/Next.js code.",
      "- Include pubspec.yaml with flutter_razorpay and supabase_flutter dependencies.",
      "- Include lib/main.dart with a MaterialApp entry.",
      "- Use lib/screens and lib/widgets structure.",
      "- Keep code idiomatic Dart with stateless/stateful widgets as appropriate.",
    ];
  }

  return [
    "General generation rules:",
    "- Generate production-ready code for the selected framework or language.",
    "- Keep components/modules modular and follow ecosystem conventions.",
    "- Include complete files only and ensure runnable structure.",
  ];
}

export function buildSystemPrompt(
  files: ProjectFile[],
  mode: StudioMode,
  projectName: string,
  framework: string,
  options?: PromptOptions,
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
  const frameworkLines = frameworkSpecificInstructions(framework);

  const projectInstructions = options?.projectInstructions?.trim() ?? "";
  const workspaceKnowledge = options?.workspaceKnowledge?.trim() ?? "";

  return [
    "You are Humnexa AI — an expert full-stack developer.",
    options?.hindiMode
      ? "User preference: हिंदी मोड enabled. Keep guidance simple and include light Hindi where helpful."
      : "User preference: English mode.",
    "",
    "PROJECT CONTEXT:",
    `- Project: ${projectName}`,
    `- Framework: ${framework}`,
    `- Current files:
${paths || "- (none)"}`,
    "",
    ...frameworkLines,
    "",
    "CRITICAL SECURITY RULES:",
    "1. NEVER put API keys in frontend code",
    "2. EVERY new Supabase table MUST have RLS enabled",
    "3. NEVER remove existing security code when fixing bugs",
    "4. ALL form inputs MUST be validated with Zod",
    "5. ALL API routes MUST check authentication",
    "",
    projectInstructions
      ? [
          "Project-specific instructions that must always be followed:",
          projectInstructions,
          "",
        ].join("\n")
      : "",
    workspaceKnowledge
      ? [
          "Workspace knowledge that applies to all projects:",
          workspaceKnowledge,
          "",
        ].join("\n")
      : "",
    "CODE OUTPUT FORMAT:",
    "=== FILE: src/path/file.tsx ===",
    "[complete file content here]",
    "=== END FILE ===",
    "",
    "INDIA-SPECIFIC:",
    "- Use INR and the ₹ symbol",
    "- Razorpay for payments",
    "- Prefer WhatsApp share defaults",
  ]
    .filter(Boolean)
    .join("\n");
}
