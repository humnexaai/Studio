"use client";

type GSTInvoiceProps = {
  invoiceNo: string;
  amount: number;
  gstPercent: number;
};

export function GSTInvoice({
  invoiceNo,
  amount,
  gstPercent,
}: GSTInvoiceProps): React.ReactElement {
  const gstAmount = (amount * gstPercent) / 100;
  const total = amount + gstAmount;

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-card p-4">
      <p className="text-xs text-brand-sub">GST INVOICE</p>
      <h3 className="mt-1 text-lg font-semibold">Invoice #{invoiceNo}</h3>
      <div className="mt-4 space-y-2 text-sm text-brand-sub">
        <div className="flex items-center justify-between">
          <span>Taxable Amount</span>
          <span>₹{amount.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>GST ({gstPercent}%)</span>
          <span>₹{gstAmount.toLocaleString("en-IN")}</span>
        </div>
        <div className="mt-2 border-t border-brand-border pt-2 text-brand-text">
          <div className="flex items-center justify-between font-semibold">
            <span>Total</span>
            <span>₹{total.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
