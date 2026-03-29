import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  try {
    const supabase = createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id,name,framework")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const db = supabase as unknown as {
      from: (table: string) => {
        insert: (values: Record<string, unknown>) => Promise<{
          error: { message?: string } | null;
        }>;
      };
    };

    const { error: insertError } = await db.from("deployments").insert({
      project_id: project.id,
      provider: "apk",
      status: "building",
      logs: "APK build queued. EAS integration will be enabled after EXPO_TOKEN is configured.",
      deployed_url: null,
    });

    if (insertError) {
      throw new Error(insertError.message ?? "Unable to create APK deployment record");
    }

    return NextResponse.json({
      success: true,
      data: {
        mockBuildUrl: `https://expo.dev/accounts/humnexa/projects/${project.id}/builds/mock`,
        message:
          "APK build request registered. For now use Expo Go locally while EAS Build is pending EXPO_TOKEN.",
        expoTestInstructions: [
          "Install Expo Go on your Android/iOS device.",
          "From project root run: npx expo start",
          "Scan the QR code from Expo DevTools to test instantly.",
        ],
      },
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to start APK build",
      },
      { status: 500 },
    );
  }
}
