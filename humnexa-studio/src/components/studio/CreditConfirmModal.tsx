"use client";

type CreditConfirmModalProps = {
  open: boolean;
  cost: number;
  balance: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export function CreditConfirmModal({
  open,
  cost,
  balance,
  onConfirm,
  onCancel,
}: CreditConfirmModalProps): React.ReactElement | null {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-card p-5">
        <h3 className="text-lg font-semibold">Confirm credit usage</h3>
        <p className="mt-3 text-sm text-brand-sub">
          This will use approximately {cost} credits. You currently have {balance}
          . Proceed?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-sub"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-brand-gradient px-3 py-2 text-sm font-semibold text-white"
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
