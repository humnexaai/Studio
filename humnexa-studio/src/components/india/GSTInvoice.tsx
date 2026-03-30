"use client";

import type { GSTInvoice as GSTInvoiceData } from "@/lib/billing/gst-invoice";

type GSTInvoiceProps = {
  invoice: GSTInvoiceData;
};

export function GSTInvoice({ invoice }: GSTInvoiceProps): React.ReactElement {
  const handlePrint = (): void => {
    window.print();
  };

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-card p-4 print:border-0 print:bg-white print:text-black">
      <p className="text-xs text-brand-sub print:text-black">GST INVOICE</p>
      <h3 className="mt-1 text-lg font-semibold text-brand-text print:text-black">
        Invoice #{invoice.invoiceNumber}
      </h3>
      <p className="text-xs text-brand-sub print:text-black">
        Date: {new Date(invoice.invoiceDate).toLocaleDateString("en-IN")} | SAC Code{" "}
        {invoice.sacCode}
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-brand-border bg-brand-card2 p-3 text-sm print:bg-white print:text-black">
          <p className="font-semibold">Supplier</p>
          <p>{invoice.seller.name}</p>
          <p>GSTIN: {invoice.seller.gstin}</p>
          <p>{invoice.seller.address}</p>
        </div>
        <div className="rounded-lg border border-brand-border bg-brand-card2 p-3 text-sm print:bg-white print:text-black">
          <p className="font-semibold">Buyer</p>
          <p>{invoice.buyer.name}</p>
          {invoice.buyer.gstin ? <p>GSTIN: {invoice.buyer.gstin}</p> : null}
          {invoice.buyer.address ? <p>{invoice.buyer.address}</p> : null}
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-brand-sub print:text-black">
        {invoice.lineItems.map((item, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={`${item.description}-${index}`}
            className="flex items-center justify-between"
          >
            <span>{item.description}</span>
            <span>₹{item.amount.toLocaleString("en-IN")}</span>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <span>Taxable Amount</span>
          <span>₹{invoice.taxableValue.toLocaleString("en-IN")}</span>
        </div>
        {invoice.isInterState ? (
          <div className="flex items-center justify-between">
            <span>IGST (18%)</span>
            <span>₹{invoice.gst.igst.toLocaleString("en-IN")}</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span>CGST (9%)</span>
              <span>₹{invoice.gst.cgst.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>SGST (9%)</span>
              <span>₹{invoice.gst.sgst.toLocaleString("en-IN")}</span>
            </div>
          </>
        )}
        <div className="mt-2 border-t border-brand-border pt-2 text-brand-text">
          <div className="flex items-center justify-between font-semibold">
            <span>Total</span>
            <span>₹{invoice.total.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="rounded-lg bg-brand-gradient px-3 py-2 text-xs font-semibold text-white"
        >
          Print Invoice
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="rounded-lg border border-brand-border px-3 py-2 text-xs text-brand-sub"
        >
          Export PDF
        </button>
      </div>
    </div>
  );
}
