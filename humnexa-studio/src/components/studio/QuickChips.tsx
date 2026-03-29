import { memo } from "react";

const chips = [
  "Add dark mode",
  "Fix errors",
  "Add UPI payment",
  "Optimize performance",
  "Add GST invoice",
];

function QuickChipsComponent({
  onSelect,
}: {
  onSelect: (value: string) => void;
}): React.ReactElement {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {chips.map((chip) => (
        <button
          key={chip}
          onClick={() => onSelect(chip)}
          className="shrink-0 rounded-full border border-brand-border bg-brand-card2 px-3 py-1 text-xs text-brand-sub transition hover:border-brand-or hover:text-brand-text"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}

export default memo(QuickChipsComponent);
