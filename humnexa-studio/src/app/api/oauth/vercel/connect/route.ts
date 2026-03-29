import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServer } from "@/lib/supabase/server";

const schema = z.object({
  accessToken: z.string().min(10),
});

type VercelUserResponse = {
  user?: {
    id?: string;
    username?: string;
    email?: string;
  };
};

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accessToken } = schema.parse(await request.json());
    const verifyResponse = await fetch("https://api.vercel.com/v2/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
    if (!verifyResponse.ok) {
      const body = await verifyResponse.text();
      return NextResponse.json(
        { error: `Invalid Vercel token: ${body}` },
        { status: 400 },
      );
    }
    const vercelUser = (await verifyResponse.json()) as VercelUserResponse;
    const metadata = {
      vercel_user_id: vercelUser.user?.id ?? null,
      user_name: vercelUser.user?.username ?? null,
      email: vercelUser.user?.email ?? null,
    };

    const db = supabase as unknown as {
      from: (table: string) => {
        upsert: (values: Record<string, unknown>) => Promise<{
          error: { message?: string } | null;
        }>;
      };
    };
    const { error } = await db.from("oauth_connections").upsert({
      user_id: user.id,
      provider: "vercel",
      access_token: accessToken,
      metadata,
    });
    if (error) {
      return NextResponse.json(
        { error: error.message ?? "Failed to save Vercel connection" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, data: metadata });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    Sentry.captureException(error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to connect Vercel",
      },
      { status: 500 },
    );
  }
}
