type DiffCardProps = {
  filePath: string;
  summary: string;
  onApply?: () => void;
  onReject?: () => void;
};

export function DiffCard({
  filePath,
  summary,
  onApply,
  onReject,
}: DiffCardProps): React.ReactElement {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-card2 p-3">
      <p className="font-code text-xs text-brand-sub">{filePath}</p>
      <p className="mt-2 text-sm text-brand-text">{summary}</p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onApply}
          className="rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white"
        >
          Apply Changes
        </button>
        <button
          onClick={onReject}
          className="rounded-lg border border-brand-border px-3 py-1.5 text-xs text-brand-sub"
        >
          Reject & Rollback
        </button>
      </div>
    </div>
  );
}
