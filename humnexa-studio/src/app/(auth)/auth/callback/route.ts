import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;
  const redirectTo = new URL("/dashboard", origin);

  const response = NextResponse.redirect(redirectTo);

  if (!code) {
    return response;
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.headers
            .get("cookie")
            ?.split("; ")
            .find((c) => c.startsWith(`${name}=`))
            ?.split("=")[1];
        },
        set(name: string, value: string, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/auth", origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth", origin));
  }

  const profileResponse = await (supabase as unknown as {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{ data: { onboarding_completed?: boolean } | null }>;
        };
      };
    };
  })
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  const onboardingComplete = Boolean(profileResponse.data?.onboarding_completed);
  return NextResponse.redirect(
    new URL(onboardingComplete ? "/dashboard" : "/onboarding", origin),
  );
}
