import { z, ZodError } from "zod";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServer } from "@/lib/supabase/server";

const schema = z.object({
  amount: z.number().int().positive(),
  currency: z.literal("INR").default("INR"),
  receipt: z.string().min(3),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const supabase = createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const input = schema.parse(body);

    const razorpayOrderId = `order_${Date.now()}`;
    const paymentOrder = {
      user_id: user.id,
      razorpay_order_id: razorpayOrderId,
      amount: input.amount,
      currency: input.currency,
      status: "created",
      receipt: input.receipt,
    };

    const { error } = await supabase.from("payment_orders").insert(paymentOrder);
    if (error) throw error;

    return Response.json({
      success: true,
      data: {
        orderId: razorpayOrderId,
        amount: input.amount,
        currency: input.currency,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Validation failed" }, { status: 400 });
    }
    Sentry.captureException(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
