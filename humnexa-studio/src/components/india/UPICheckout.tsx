"use client";

type Props = {
  amount: number;
  orderId: string;
  onSuccess: (payload: unknown) => void;
  onFailure: (payload: { code: string }) => void;
};

export function UPICheckout({
  amount,
  orderId,
  onSuccess,
  onFailure,
}: Props): React.ReactElement {
  const handlePayment = async (): Promise<void> => {
    const w = window as Window & { Razorpay?: new (options: unknown) => { open: () => void } };

    if (!w.Razorpay) {
      await new Promise<void>((resolve) => {
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => resolve();
        document.head.appendChild(s);
      });
    }

    if (!w.Razorpay) {
      onFailure({ code: "SDK_LOAD_FAILED" });
      return;
    }

    const rzp = new w.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount,
      currency: "INR",
      order_id: orderId,
      theme: { color: "#FF6B2C" },
      method: { upi: true, card: true, netbanking: true },
      handler: onSuccess,
      modal: { ondismiss: () => onFailure({ code: "CANCELLED" }) },
    });
    rzp.open();
  };

  return (
    <button
      type="button"
      onClick={handlePayment}
      className="w-full rounded-xl bg-brand-gradient py-3 font-bold text-white"
    >
      {"💳 Pay ₹"}
      {(amount / 100).toLocaleString("en-IN")}
      {" via UPI"}
    </button>
  );
}
