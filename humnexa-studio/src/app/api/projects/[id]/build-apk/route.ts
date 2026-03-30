import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { checkRateLimitByIp, getClientIpFromHeaders } from "@/lib/rate-limit";

export const preferredRegion = "bom1";

type RouteContext = { params: { id: string } };

export async function POST(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  try {
    const ip = getClientIpFromHeaders(request.headers);
    const rate = checkRateLimitByIp(ip, 10, 60_000);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before retrying", retryAfter: rate.retryAfter },
        { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
      );
    }

    const supabase = createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: project } = await supabase
      .from("projects")
      .select("id,user_id,name")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await supabase.from("deployments").insert({
      project_id: project.id,
      provider: "apk",
      status: "building",
      logs: "APK build queued. EAS integration will be enabled after EXPO_TOKEN is configured.",
      deployed_url: null,
    });

    return NextResponse.json({
      success: true,
      data: {
        mockBuildUrl: `https://expo.dev/accounts/humnexa/projects/${project.id}/builds/mock`,
        message:
          "APK build request registered. For now use Expo Go locally while EAS Build is pending EXPO_TOKEN.",
        expoTestInstructions: [
          "Install Expo Go on your Android device.",
          "From project root run: npx expo start",
          "Scan the QR code from Expo CLI using Expo Go.",
        ],
      },
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start APK build" },
      { status: 500 },
    );
  }
}
