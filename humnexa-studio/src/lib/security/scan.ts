import type { ProjectFile } from "@/types/studio";

type SecurityIssue = {
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  file: string;
  issue: string;
};

type ScanResult = {
  critical: SecurityIssue[];
  high: SecurityIssue[];
  medium: SecurityIssue[];
  blockDeploy: boolean;
};

const API_KEY_PATTERNS: Array<{ regex: RegExp; message: string }> = [
  { regex: /sk-[a-zA-Z0-9]{20,}/, message: "OpenAI style secret key detected" },
  { regex: /gsk_[A-Za-z0-9_\-]+/, message: "Groq style secret key detected" },
  { regex: /rzp_live_[A-Za-z0-9_\-]+/, message: "Razorpay live key detected" },
  {
    regex: /GROQ_API_KEY\s*=\s*['"][^'"]+['"]/,
    message: "Hardcoded GROQ_API_KEY assignment detected",
  },
];

function isClientSidePath(path: string): boolean {
  const lower = path.toLowerCase();
  return (
    lower.endsWith(".tsx") ||
    lower.endsWith(".jsx") ||
    lower.endsWith(".ts") ||
    lower.endsWith(".js")
  );
}

function isServerSafePath(path: string): boolean {
  const normalized = path.replaceAll("\\", "/");
  return (
    normalized.includes("/api/") ||
    normalized.includes("/lib/") ||
    normalized.startsWith("api/") ||
    normalized.startsWith("lib/")
  );
}

function hasClientDirective(content: string): boolean {
  return /^\s*["']use client["'];?/m.test(content);
}

function sqlHasCreateTableWithoutRls(content: string): boolean {
  if (!/create\s+table/i.test(content)) return false;
  if (/enable\s+row\s+level\s+security/i.test(content)) return false;
  return true;
}

export function scanProjectFiles(projectFiles: ProjectFile[]): ScanResult {
  const issues: SecurityIssue[] = [];

  for (const file of projectFiles) {
    const path = file.path;
    const content = file.content ?? "";
    const lower = path.toLowerCase();

    if (isClientSidePath(path) && !isServerSafePath(path)) {
      for (const pattern of API_KEY_PATTERNS) {
        if (pattern.regex.test(content)) {
          issues.push({
            severity: "CRITICAL",
            file: path,
            issue: `${pattern.message} in client-side code`,
          });
        }
      }
    }

    if (lower.endsWith(".sql") && sqlHasCreateTableWithoutRls(content)) {
      issues.push({
        severity: "CRITICAL",
        file: path,
        issue: "CREATE TABLE found without ENABLE ROW LEVEL SECURITY",
      });
    }

    if (hasClientDirective(content) && /process\.env\.[A-Z0-9_]+/g.test(content)) {
      const matches = content.match(/process\.env\.([A-Z0-9_]+)/g) ?? [];
      for (const match of matches) {
        const key = match.replace("process.env.", "");
        if (!key.startsWith("NEXT_PUBLIC_")) {
          issues.push({
            severity: "CRITICAL",
            file: path,
            issue: `Client code uses non-public env var: ${key}`,
          });
        }
      }
    }

    const fetchCalls = content.match(/fetch\(/g)?.length ?? 0;
    const hasAuthHeader = /authorization\s*:/i.test(content);
    if (fetchCalls > 0 && !hasAuthHeader) {
      issues.push({
        severity: "HIGH",
        file: path,
        issue: "fetch() call without auth headers detected",
      });
    }

    if (/<form[\s>]/i.test(content) && !/onChange\s*=/.test(content)) {
      issues.push({
        severity: "HIGH",
        file: path,
        issue: "Form found without onChange validation hooks",
      });
    }

    if (/TODO|FIXME/i.test(content)) {
      issues.push({
        severity: "MEDIUM",
        file: path,
        issue: "Contains TODO/FIXME markers",
      });
    }
  }

  return {
    critical: issues.filter((issue) => issue.severity === "CRITICAL"),
    high: issues.filter((issue) => issue.severity === "HIGH"),
    medium: issues.filter((issue) => issue.severity === "MEDIUM"),
    blockDeploy: issues.some((issue) => issue.severity === "CRITICAL"),
  };
}
