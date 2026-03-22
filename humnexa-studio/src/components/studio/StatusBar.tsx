type StatusBarProps = {
  branchName?: string | null;
  errorCount: number;
  supabaseConnected: boolean;
  lastModel?: string | null;
  deployedUrl?: string | null;
};

export function StatusBar({
  branchName,
  errorCount,
  supabaseConnected,
  lastModel,
  deployedUrl,
}: StatusBarProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between border-t border-brand-border bg-brand-or/20 px-3 py-2 text-xs text-brand-text">
      <span>⎇ {branchName?.trim() ? branchName : "main"}</span>
      <span>
        {errorCount > 0 ? `⚠ ${errorCount} errors` : "✅ No errors"}
      </span>
      <span>{supabaseConnected ? "🔌 Supabase connected" : "🔌 Supabase offline"}</span>
      <span>⚡ {lastModel ?? "unknown model"}</span>
      <span>
        {deployedUrl ? (
          <a
            href={deployedUrl}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            {deployedUrl}
          </a>
        ) : (
          "Not deployed"
        )}
      </span>
    </div>
  );
}
