import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // TODO: verify signature with RAZORPAY_KEY_SECRET and credit wallet.
  return NextResponse.json({ success: true });
}
