"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";

type ThemeMode = "dark" | "light" | "system";
type TabSize = 2 | 4;
type FontFamily = "JetBrains Mono" | "Fira Code";

type SettingsData = {
  id: string;
  theme: ThemeMode;
  hindi_mode: boolean;
  workspace_knowledge?: string;
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

type ProviderType = "github" | "google" | "vercel";

type PatchPayload = Partial<{
  theme: ThemeMode;
  hindi_mode: boolean;
  workspace_knowledge: string;
  editor_font_size: number;
  editor_tab_size: number;
  editor_font_family: string;
  notifications_deploy: boolean;
  notifications_credits: boolean;
  notifications_team: boolean;
}>;

function applyTheme(theme: ThemeMode): void {
  const html = document.documentElement;
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    html.dataset.theme = prefersDark ? "dark" : "light";
  } else {
    html.dataset.theme = theme;
  }
}

export default function SettingsClient({
  initialSettings,
  connections,
}: {
  initialSettings: SettingsData;
  connections: OauthConnection[];
}): React.ReactElement {
  const setThemeStore = useUserStore((state) => state.setTheme);
  const setHindiModeStore = useUserStore((state) => state.setHindiMode);
  const setEditorFontSizeStore = useUserStore((state) => state.setEditorFontSize);
  const setEditorTabSizeStore = useUserStore((state) => state.setEditorTabSize);
  const setEditorFontFamilyStore = useUserStore((state) => state.setEditorFontFamily);

  const [theme, setTheme] = useState<ThemeMode>(initialSettings.theme);
  const [fontSize, setFontSize] = useState(initialSettings.editor_font_size);
  const [tabSize, setTabSize] = useState<TabSize>(
    initialSettings.editor_tab_size === 4 ? 4 : 2,
  );
  const [fontFamily, setFontFamily] = useState<FontFamily>(
    initialSettings.editor_font_family === "Fira Code" ? "Fira Code" : "JetBrains Mono",
  );
  const [notificationsDeploy, setNotificationsDeploy] = useState(
    initialSettings.notifications_deploy,
  );
  const [notificationsCredits, setNotificationsCredits] = useState(
    initialSettings.notifications_credits,
  );
  const [notificationsTeam, setNotificationsTeam] = useState(
    initialSettings.notifications_team,
  );
  const [hindiMode, setHindiMode] = useState(initialSettings.hindi_mode);
  const [workspaceKnowledge, setWorkspaceKnowledge] = useState(
    initialSettings.workspace_knowledge ?? "",
  );
  const [toast, setToast] = useState<string | null>(null);
  const [oauthRows, setOauthRows] = useState<OauthConnection[]>(connections);
  const debounceRef = useRef<number | null>(null);
  const loadedUserIdRef = useRef<string | null>(null);
  const toastRef = useRef<number | null>(null);

  const githubConnection = useMemo(
    () => oauthRows.find((row) => row.provider === "github") ?? null,
    [oauthRows],
  );
  const googleConnection = useMemo(
    () => oauthRows.find((row) => row.provider === "google") ?? null,
    [oauthRows],
  );
  const vercelConnection = useMemo(
    () => oauthRows.find((row) => row.provider === "vercel") ?? null,
    [oauthRows],
  );

  const showToast = (message: string): void => {
    setToast(message);
    if (toastRef.current) {
      window.clearTimeout(toastRef.current);
    }
    toastRef.current = window.setTimeout(() => setToast(null), 2400);
  };

  const persistSettings = useCallback((patch: PatchPayload): void => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(async () => {
      const userId = loadedUserIdRef.current;
      if (!userId) return;
      const db = supabase as unknown as {
        from: (table: string) => {
          upsert: (values: Record<string, unknown>) => Promise<{
            error: { message?: string } | null;
          }>;
        };
      };
      const { error } = await db.from("user_settings").upsert({
        id: userId,
        ...patch,
      });
      if (error) {
        showToast(error.message ?? "Failed to save settings");
      }
    }, 500);
  }, []);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data: authData }) => {
      loadedUserIdRef.current = authData.user?.id ?? null;
    });
  }, []);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("humnexa-theme", theme);
    setThemeStore(theme);
    persistSettings({ theme });
  }, [theme, setThemeStore, persistSettings]);

  useEffect(() => {
    setHindiModeStore(hindiMode);
    persistSettings({ hindi_mode: hindiMode });
    if (hindiMode) {
      showToast("हिंदी मोड चालू है");
    }
  }, [hindiMode, setHindiModeStore, persistSettings]);

  useEffect(() => {
    persistSettings({ workspace_knowledge: workspaceKnowledge });
  }, [workspaceKnowledge, persistSettings]);

  useEffect(() => {
    persistSettings({
      editor_font_size: fontSize,
      editor_tab_size: tabSize,
      editor_font_family: fontFamily,
      notifications_deploy: notificationsDeploy,
      notifications_credits: notificationsCredits,
      notifications_team: notificationsTeam,
    });
    setEditorFontSizeStore(fontSize);
    setEditorTabSizeStore(tabSize);
    setEditorFontFamilyStore(fontFamily);
  }, [
    fontSize,
    tabSize,
    fontFamily,
    notificationsDeploy,
    notificationsCredits,
    notificationsTeam,
    setEditorFontSizeStore,
    setEditorTabSizeStore,
    setEditorFontFamilyStore,
    persistSettings,
  ]);

  const connectProvider = async (provider: ProviderType): Promise<void> => {
    if (provider === "vercel") {
      const accessToken = window.prompt("Paste your Vercel access token:");
      if (!accessToken?.trim()) return;
      const response = await fetch("/api/oauth/vercel/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: accessToken.trim() }),
      });
      const payload = (await response.json()) as {
        error?: string;
        data?: { user_name?: string | null };
      };
      if (!response.ok) {
        showToast(payload.error ?? "Failed to connect Vercel");
        return;
      }
      setOauthRows((prev) => {
        const next = prev.filter((row) => row.provider !== "vercel");
        next.push({
          id: `vercel-${Date.now()}`,
          provider: "vercel",
          metadata: { user_name: payload.data?.user_name ?? "Connected" },
        });
        return next;
      });
      showToast("Vercel connected");
      return;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options:
        provider === "github"
          ? { scopes: "repo", redirectTo: `${window.location.origin}/auth/callback` }
          : { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      showToast(error.message);
      return;
    }
    if (data.url) {
      window.location.href = data.url;
    }
  };

  const disconnectProvider = async (provider: ProviderType): Promise<void> => {
    const db = supabase as unknown as {
      from: (table: string) => {
        delete: () => {
          eq: (column: string, value: string) => {
            eq: (column2: string, value2: string) => Promise<{
              error: { message?: string } | null;
            }>;
          };
        };
      };
    };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await db
      .from("oauth_connections")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", provider);
    if (error) {
      showToast(error.message ?? `Failed to disconnect ${provider}`);
      return;
    }
    setOauthRows((prev) => prev.filter((row) => row.provider !== provider));
    showToast(`${provider} disconnected`);
  };

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      {toast ? (
        <div className="rounded-xl border border-brand-border bg-brand-card p-3 text-sm text-brand-text">
          {toast}
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
          <h2 className="mb-2 font-medium">Appearance</h2>
          <div className="mt-3 flex gap-2">
            {(["dark", "light", "system"] as ThemeMode[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  theme === value
                    ? "border-brand-or bg-brand-or/15 text-brand-text"
                    : "border-brand-border bg-brand-card2 text-brand-sub"
                }`}
              >
                {value[0].toUpperCase()}
                {value.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
          <h2 className="mb-2 font-medium">Editor</h2>
          <label className="text-xs text-brand-sub">
            Font size: {fontSize}
            <input
              type="range"
              min={11}
              max={20}
              value={fontSize}
              onChange={(event) => setFontSize(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <select
              value={tabSize}
              onChange={(event) => setTabSize(Number(event.target.value) as TabSize)}
              className="rounded-lg border border-brand-border bg-brand-card2 px-2 py-1.5 text-sm"
            >
              <option value={2}>Tab size 2</option>
              <option value={4}>Tab size 4</option>
            </select>
            <select
              value={fontFamily}
              onChange={(event) => setFontFamily(event.target.value as FontFamily)}
              className="rounded-lg border border-brand-border bg-brand-card2 px-2 py-1.5 text-sm"
            >
              <option value="JetBrains Mono">JetBrains Mono</option>
              <option value="Fira Code">Fira Code</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
          <h2 className="mb-2 font-medium">Notifications</h2>
          <ToggleRow
            label="Deploy notifications"
            checked={notificationsDeploy}
            onChange={setNotificationsDeploy}
          />
          <ToggleRow
            label="Credits notifications"
            checked={notificationsCredits}
            onChange={setNotificationsCredits}
          />
          <ToggleRow
            label="Team notifications"
            checked={notificationsTeam}
            onChange={setNotificationsTeam}
          />
          <button
            type="button"
            onClick={() => {
              void Notification.requestPermission();
            }}
            className="mt-3 rounded-lg border border-brand-border px-3 py-1.5 text-xs text-brand-sub"
          >
            Request desktop notification permission
          </button>
        </div>

        <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
          <h2 className="mb-2 font-medium">Language</h2>
          <label className="flex items-center gap-2 text-sm text-brand-sub">
            <input
              type="checkbox"
              checked={hindiMode}
              onChange={(event) => setHindiMode(event.target.checked)}
              className="accent-brand-or"
            />
            Hindi Mode
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
        <h2 className="mb-2 font-medium">Workspace Knowledge</h2>
        <p className="text-xs text-brand-sub">
          Persistent instructions applied to AI prompts across all your projects.
        </p>
        <textarea
          value={workspaceKnowledge}
          maxLength={10000}
          onChange={(event) => setWorkspaceKnowledge(event.target.value)}
          placeholder="Add global context, coding standards, architecture notes, or business rules..."
          rows={6}
          className="mt-3 w-full rounded-xl border border-brand-border bg-brand-card2 px-3 py-2 text-sm outline-none"
        />
        <div className="mt-2 text-right text-[11px] text-brand-muted">
          {workspaceKnowledge.length}/10000
        </div>
      </div>

      <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
        <h2 className="mb-3 font-medium">Connected accounts</h2>
        <div className="space-y-2">
          <AccountRow
            label="GitHub"
            status={
              githubConnection
                ? githubConnection.metadata?.user_name ??
                  githubConnection.metadata?.username ??
                  "Connected"
                : "Not connected"
            }
            connected={Boolean(githubConnection)}
            onConnect={() => {
              void connectProvider("github");
            }}
            onDisconnect={() => {
              void disconnectProvider("github");
            }}
          />
          <AccountRow
            label="Vercel"
            status={vercelConnection ? "Connected" : "Not connected"}
            connected={Boolean(vercelConnection)}
            onConnect={() => {
              void connectProvider("vercel");
            }}
            onDisconnect={() => {
              void disconnectProvider("vercel");
            }}
          />
          <AccountRow
            label="Google"
            status={googleConnection ? "Connected" : "Not connected"}
            connected={Boolean(googleConnection)}
            onConnect={() => {
              void connectProvider("google");
            }}
            onDisconnect={() => {
              void disconnectProvider("google");
            }}
          />
        </div>
      </div>
    </section>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}): React.ReactElement {
  return (
    <label className="mb-2 flex items-center justify-between rounded-lg border border-brand-border bg-brand-card2 px-3 py-2 text-sm text-brand-sub">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-brand-or"
      />
    </label>
  );
}

function AccountRow({
  label,
  status,
  connected,
  onConnect,
  onDisconnect,
}: {
  label: string;
  status: string;
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between rounded-lg border border-brand-border bg-brand-card2 px-3 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-brand-sub">{status}</p>
      </div>
      {connected ? (
        <button
          type="button"
          onClick={onDisconnect}
          className="rounded-lg border border-brand-border px-3 py-1.5 text-xs text-brand-sub"
        >
          Disconnect
        </button>
      ) : (
        <button
          type="button"
          onClick={onConnect}
          className="rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white"
        >
          Connect
        </button>
      )}
    </div>
  );
}
