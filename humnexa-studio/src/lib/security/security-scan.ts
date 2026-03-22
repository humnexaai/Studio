type SecurityIssue = {
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  file: string;
  issue: string;
};

function isClientFile(path: string): boolean {
  return (
    path.endsWith(".tsx") ||
    path.endsWith(".jsx") ||
    path.endsWith(".ts") ||
    path.endsWith(".js")
  );
}

function extractTableNames(sql: string): string[] {
  const matches = Array.from(
    sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?([a-z0-9_."]+)/gi),
  );
  const names: string[] = [];
  for (const match of matches) {
    names.push(match[1].replace(/"/g, ""));
  }
  return names;
}

export function securityScan(
  projectFiles: Array<{ path: string; content: string }>,
): {
  critical: SecurityIssue[];
  high: SecurityIssue[];
  medium: SecurityIssue[];
  blockDeploy: boolean;
} {
  const issues: SecurityIssue[] = [];

  for (const file of projectFiles) {
    if (isClientFile(file.path)) {
      const keyPatterns = [/GROQ_API_KEY/, /sk-[a-zA-Z0-9]{20}/, /rzp_live_/];
      for (const pattern of keyPatterns) {
        if (pattern.test(file.content)) {
          issues.push({
            severity: "CRITICAL",
            file: file.path,
            issue: "API key exposed in client code",
          });
        }
      }
    }

    if (file.path.includes("migration") || file.path.endsWith(".sql")) {
      const tables = extractTableNames(file.content);
      if (tables.length > 0 && !/enable\s+row\s+level\s+security/i.test(file.content)) {
        for (const table of tables) {
          issues.push({
            severity: "CRITICAL",
            file: file.path,
            issue: `Table ${table} missing RLS`,
          });
        }
      }
    }
  }

  const critical = issues.filter((issue) => issue.severity === "CRITICAL");
  const high = issues.filter((issue) => issue.severity === "HIGH");
  const medium = issues.filter((issue) => issue.severity === "MEDIUM");

  return {
    critical,
    high,
    medium,
    blockDeploy: critical.length > 0,
  };
}
