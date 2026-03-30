import * as Sentry from "@sentry/nextjs";
import { createSupabaseServer } from "@/lib/supabase/server";

export const preferredRegion = "bom1";
const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown";

export async function GET(): Promise<Response> {
  const now = new Date().toISOString();
  try {
    const supabase = createSupabaseServer();
    const { error } = await supabase
      .from("plans")
      .select("id", { count: "exact", head: true });

    const supabaseConnected = !error;
    return Response.json({
      status: "ok",
      supabase_connected: supabaseConnected,
      timestamp: now,
      version: appVersion,
    });
  } catch (error) {
    Sentry.captureException(error);
    return Response.json(
      {
        status: "ok",
        supabase_connected: false,
        timestamp: now,
        version: appVersion,
      },
      { status: 200 },
    );
  }
}
