import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";
import { createSupabaseServer } from "@/lib/supabase/server";

type SettingsRow = {
  id: string;
  theme: "dark" | "light" | "system";
  hindi_mode: boolean;
  editor_font_size: number;
  editor_tab_size: number;
  editor_font_family: string;
  notifications_deploy: boolean;
  notifications_credits: boolean;
  notifications_team: boolean;
};

type OauthConnection = {
  id: string;
  provider: "github" | "google" | "vercel";
  metadata: { user_name?: string; username?: string } | null;
};

const defaultSettings: SettingsRow = {
  id: "",
  theme: "dark",
  hindi_mode: false,
  editor_font_size: 14,
  editor_tab_size: 2,
  editor_font_family: "JetBrains Mono",
  notifications_deploy: true,
  notifications_credits: true,
  notifications_team: true,
};

export default async function SettingsPage(): Promise<React.ReactElement> {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  const [{ data: settings }, { data: connections }] = await Promise.all([
    supabase
      .from("user_settings")
      .select(
        "id,theme,hindi_mode,editor_font_size,editor_tab_size,editor_font_family,notifications_deploy,notifications_credits,notifications_team",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("oauth_connections")
      .select("id,provider,metadata")
      .eq("user_id", user.id)
      .in("provider", ["github", "google", "vercel"]),
  ]);

  const typedSettings = (settings as SettingsRow | null) ?? {
    ...defaultSettings,
    id: user.id,
  };
  const typedConnections = ((connections ?? []) as OauthConnection[]).filter((row) =>
    ["github", "google", "vercel"].includes(row.provider),
  );

  return (
    <SettingsClient
      initialSettings={{ ...typedSettings, id: user.id }}
      connections={typedConnections}
    />
  );
}
