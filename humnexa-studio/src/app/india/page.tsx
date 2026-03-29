import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "India Stack - Humnexa Studio",
  description: "One-prompt India integrations for your apps.",
};

const sections = [
  {
    title: "UPI Payment Integration",
    prompt: "Add UPI payment",
    result:
      "Generates a complete Razorpay checkout component with INR amount conversion, prefill, and payment verification callback.",
    code: `"use client";

import { useState } from "react";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

export default function RazorpayCheckout(): React.ReactElement {
  const [loading, setLoading] = useState(false);

  const startPayment = async (): Promise<void> => {
    setLoading(true);
    const orderRes = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: "starter-plan-id", amount_inr: 199 }),
    });
    const order = await orderRes.json();

    const rzp = new window.Razorpay({
      key: order.data.keyId,
      amount: order.data.amount,
      currency: "INR",
      order_id: order.data.orderId,
      name: "Humnexa Studio",
      description: "UPI subscription payment",
      prefill: { contact: "9876543210", email: "builder@humnexa.com" },
      handler: async (payload: Record<string, unknown>) => {
        await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      },
      theme: { color: "#FF6B2C" },
    });

    rzp.open();
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={() => {
        void startPayment();
      }}
      disabled={loading}
      className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white"
    >
      {loading ? "Preparing..." : "Pay with UPI"}
    </button>
  );
}`,
  },
  {
    title: "GST Invoice Generation",
    prompt: "Generate GST invoice",
    result:
      "Creates GST-compliant invoices with GSTIN, HSN/SAC lines, CGST + SGST split, totals, and PDF export support.",
    code: `const invoice = {
  sellerGstin: "27ABCDE1234F1Z5",
  buyerGstin: "29AAFCB1234K1Z9",
  items: [
    { name: "Pro Plan", hsn: "998314", qty: 1, price: 999 },
  ],
};

const taxable = invoice.items.reduce((sum, item) => sum + item.qty * item.price, 0);
const cgst = taxable * 0.09;
const sgst = taxable * 0.09;
const total = taxable + cgst + sgst;

// PDF export payload
const pdfPayload = {
  gstin: invoice.sellerGstin,
  items: invoice.items,
  taxable,
  cgst,
  sgst,
  total,
};`,
  },
  {
    title: "WhatsApp Integration",
    prompt: "Add WhatsApp share button",
    result:
      "Builds a reusable WhatsApp share component with encoded message links and mobile-friendly behavior.",
    code: `"use client";

type Props = {
  text: string;
  url: string;
};

export function WhatsAppShareButton({ text, url }: Props): React.ReactElement {
  const message = encodeURIComponent(text + " " + url);
  const href = "https://wa.me/?text=" + message;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex rounded-lg border border-brand-border px-3 py-2 text-sm"
    >
      Share on WhatsApp
    </a>
  );
}`,
  },
  {
    title: "Aadhaar KYC Verification",
    prompt: "Add Aadhaar verification",
    result:
      "Implements Aadhaar OTP flow: submit Aadhaar number, generate OTP, verify OTP, and persist KYC status.",
    code: `const initiateAadhaarOtp = async (aadhaarNumber: string): Promise<void> => {
  await fetch("/api/kyc/aadhaar/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ aadhaarNumber }),
  });
};

const verifyAadhaarOtp = async (requestId: string, otp: string): Promise<void> => {
  await fetch("/api/kyc/aadhaar/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId, otp }),
  });
};`,
  },
  {
    title: "Cash on Delivery",
    prompt: "Add COD option",
    result:
      "Generates checkout logic for COD with address validation, phone OTP confirmation, and order placement safeguards.",
    code: `type PaymentMode = "upi" | "card" | "cod";

const placeOrder = async (mode: PaymentMode, phone: string, otp?: string): Promise<void> => {
  if (mode === "cod") {
    await fetch("/api/orders/cod/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    await fetch("/api/orders/cod/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp }),
    });
  }

  await fetch("/api/orders/place", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });
};`,
  },
];

export default function IndiaStackPage(): React.ReactElement {
  return (
    <main className="min-h-screen bg-[#060810] px-6 py-12 text-brand-text">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <section className="rounded-3xl border border-brand-border bg-brand-card p-8 text-center">
          <p className="mb-3 inline-flex rounded-full border border-brand-or/40 bg-brand-or/10 px-3 py-1 text-xs text-brand-or">
            India-first automation
          </p>
          <h1 className="font-display text-4xl font-black md:text-5xl">India Stack</h1>
          <p className="mt-3 text-lg text-brand-sub">
            One prompt. Complete India integration.
          </p>
        </section>

        <section className="grid gap-6">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-2xl border border-brand-border bg-brand-card p-6"
            >
              <h2 className="text-2xl font-bold">{section.title}</h2>
              <div className="mt-4 rounded-xl border border-brand-or bg-brand-card2 p-3 font-code text-sm text-brand-or">
                {section.prompt}
              </div>
              <p className="mt-4 text-sm text-brand-sub">{section.result}</p>
              <pre className="mt-4 overflow-x-auto rounded-xl border border-brand-border bg-brand-bg p-4 font-code text-xs text-brand-sub">
                {section.code}
              </pre>
            </article>
          ))}
        </section>

        <div className="text-center">
          <a
            href="/auth"
            className="inline-flex rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white"
          >
            Get started free
          </a>
        </div>
      </div>
    </main>
  );
}
