type SellerDetails = {
  name: string;
  gstin: string;
  address: string;
};

type BuyerDetails = {
  name: string;
  gstin?: string | null;
  address?: string | null;
};

type LineItem = {
  description: string;
  amount: number;
};

type GenerateGSTInvoiceInput = {
  seller: SellerDetails;
  buyer: BuyerDetails;
  lineItems: LineItem[];
  isInterState: boolean;
  sacCode?: string;
};

type GSTBreakdown = {
  cgst: number;
  sgst: number;
  igst: number;
};

export type GSTInvoice = {
  invoiceNumber: string;
  invoiceDate: string;
  sacCode: string;
  seller: SellerDetails;
  buyer: BuyerDetails;
  lineItems: LineItem[];
  taxableValue: number;
  gst: GSTBreakdown;
  total: number;
  isInterState: boolean;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildInvoiceNumber(): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `HNX-${stamp}-${rand}`;
}

export function generateGSTInvoice(input: GenerateGSTInvoiceInput): GSTInvoice {
  const sacCode = input.sacCode ?? "9983";
  const taxableValue = round2(
    input.lineItems.reduce((sum, item) => sum + Math.max(item.amount, 0), 0),
  );

  const cgst = input.isInterState ? 0 : round2(taxableValue * 0.09);
  const sgst = input.isInterState ? 0 : round2(taxableValue * 0.09);
  const igst = input.isInterState ? round2(taxableValue * 0.18) : 0;
  const total = round2(taxableValue + cgst + sgst + igst);

  return {
    invoiceNumber: buildInvoiceNumber(),
    invoiceDate: new Date().toISOString(),
    sacCode,
    seller: input.seller,
    buyer: input.buyer,
    lineItems: input.lineItems,
    taxableValue,
    gst: { cgst, sgst, igst },
    total,
    isInterState: input.isInterState,
  };
}
