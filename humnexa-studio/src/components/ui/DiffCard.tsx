import { memo } from "react";

type DiffCardProps = {
  filePath: string;
  summary: string;
  before?: string;
  after?: string;
};

function DiffCardComponent({
  filePath,
  summary,
  before = "",
  after = "",
}: DiffCardProps): React.ReactElement {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  let added = 0;
  let removed = 0;
  const maxLines = Math.max(beforeLines.length, afterLines.length);
  const unified: string[] = [];
  for (let i = 0; i < maxLines; i += 1) {
    const prev = beforeLines[i] ?? "";
    const next = afterLines[i] ?? "";
    if (prev === next) {
      unified.push(` ${next}`);
      continue;
    }
    if (prev) {
      unified.push(`-${prev}`);
      removed += 1;
    }
    if (next) {
      unified.push(`+${next}`);
      added += 1;
    }
  }
  return (
    <details className="rounded-xl border border-brand-border bg-brand-card2 p-3">
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-code text-xs text-brand-sub">{filePath}</p>
            <p className="mt-1 text-sm text-brand-text">{summary}</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded bg-brand-gr/15 px-2 py-0.5 text-brand-gr">
              +{added}
            </span>
            <span className="rounded bg-brand-error/15 px-2 py-0.5 text-brand-error">
              -{removed}
            </span>
          </div>
        </div>
      </summary>
      <pre className="mt-3 max-h-52 overflow-auto rounded-lg border border-brand-border bg-brand-bg p-2 font-code text-[11px] leading-5 text-brand-sub">
        {unified.length > 0 ? unified.join("\n") : "No textual diff to preview."}
      </pre>
    </details>
  );
}

export const DiffCard = memo(DiffCardComponent);
