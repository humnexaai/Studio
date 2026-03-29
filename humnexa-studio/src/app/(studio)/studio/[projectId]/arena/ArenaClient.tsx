"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DiffBlock } from "@/types/studio";

type ProviderResponse = {
  provider: string;
  content: string;
  tokenCount: number;
  diffs: Array<{ path: string; content: string }>;
};

type ArenaClientProps = {
  projectId: string;
  projectName: string;
  framework: string;
  currentFiles: Array<{ path: string; content: string }>;
};

function providerTitle(provider: string): string {
  const normalized = provider.toLowerCase();
  if (normalized === "groq") return "Groq LLaMA";
  if (normalized === "claude") return "Claude";
  if (normalized === "openai") return "GPT";
  return provider;
}

function toDiffBlocks(
  updates: Array<{ path: string; content: string }>,
  files: Array<{ path: string; content: string }>,
): DiffBlock[] {
  const currentMap = new Map(files.map((file) => [file.path, file.content]));
  return updates.map((update, index) => {
    const before = currentMap.get(update.path) ?? "";
    const after = update.content;
    return {
      id: `${update.path}-${index}`,
      filePath: update.path,
      before,
      after,
      summary: `${before ? "Update" : "Create"} ${update.path}`,
    };
  });
}

export default function ArenaClient({
  projectId,
  projectName,
  framework,
  currentFiles,
}: ArenaClientProps): React.ReactElement {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderResponse[]>([]);
  const [creditsCharged, setCreditsCharged] = useState<number>(0);
  const [acceptingProvider, setAcceptingProvider] = useState<string | null>(null);

  const estimatedDoubleCost = useMemo(() => {
    const length = prompt.trim().length;
    if (!length) return 0;
    if (length <= 50) return 2;
    if (length <= 400) return 6;
    if (length <= 900) return 10;
    return 16;
  }, [prompt]);

  const runArena = async (): Promise<void> => {
    if (!prompt.trim()) return;
    try {
      setLoading(true);
      setError(null);
      setProviders([]);
      const response = await fetch("/api/chat/arena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          conversationId: null,
          message: prompt.trim(),
          mode: "agent",
          currentFiles,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        data?: {
          creditsCharged?: number;
          providers?: ProviderResponse[];
        };
      };
      if (!response.ok || !payload.data?.providers) {
        throw new Error(payload.error ?? "Arena request failed");
      }
      setCreditsCharged(payload.data.creditsCharged ?? 0);
      setProviders(payload.data.providers);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Arena request failed");
    } finally {
      setLoading(false);
    }
  };

  const acceptProvider = async (result: ProviderResponse): Promise<void> => {
    if ((result.diffs ?? []).length === 0) {
      setError("No file changes found in selected response.");
      return;
    }
    try {
      setAcceptingProvider(result.provider);
      setError(null);
      for (const diff of result.diffs) {
        const fileResponse = await fetch(`/api/projects/${projectId}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filePath: diff.path,
            content: diff.content,
          }),
        });
        if (!fileResponse.ok) {
          const payload = (await fileResponse.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? `Failed to write ${diff.path}`);
        }
      }
      router.push(`/studio/${projectId}`);
      router.refresh();
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Failed to apply output");
    } finally {
      setAcceptingProvider(null);
    }
  };

  const providerCards = providers.slice(0, 2);

  return (
    <main className="min-h-screen space-y-5 bg-brand-bg px-4 py-6">
      <header className="rounded-2xl border border-brand-border bg-brand-card p-4">
        <h1 className="text-2xl font-semibold">Arena Mode</h1>
        <p className="mt-1 text-sm text-brand-sub">
          Compare two AI models side by side for <span className="text-brand-or">{projectName}</span>{" "}
          ({framework}). Arena mode costs double credits.
        </p>
      </header>

      <section className="rounded-2xl border border-brand-border bg-brand-card p-4">
        <label className="mb-2 block text-xs text-brand-sub">Prompt</label>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={4}
          placeholder="Ask both models to generate and compare outputs..."
          className="w-full rounded-xl border border-brand-border bg-brand-card2 px-3 py-2 text-sm outline-none"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-brand-sub">
            Estimated cost:{" "}
            <span className="font-semibold text-brand-or">{estimatedDoubleCost} credits</span>
          </p>
          <button
            type="button"
            onClick={() => {
              void runArena();
            }}
            disabled={loading || !prompt.trim()}
            className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Running..." : "Run Arena"}
          </button>
        </div>
        {creditsCharged > 0 ? (
          <p className="mt-2 text-xs text-brand-gr">Credits charged: {creditsCharged}</p>
        ) : null}
        {error ? <p className="mt-2 text-xs text-brand-error">{error}</p> : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {providerCards.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-brand-border bg-brand-card p-6 text-center text-sm text-brand-sub">
            Run an arena prompt to compare outputs from Groq and Claude/GPT.
          </div>
        ) : null}
        {providerCards.map((providerResult) => {
          const diffPreview = toDiffBlocks(providerResult.diffs, currentFiles);
          return (
            <article
              key={providerResult.provider}
              className="rounded-2xl border border-brand-border bg-brand-card p-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {providerTitle(providerResult.provider)}
                </h2>
                <span className="rounded bg-brand-card2 px-2 py-0.5 text-xs text-brand-sub">
                  {providerResult.tokenCount} tokens
                </span>
              </div>
              <pre className="mt-3 max-h-72 overflow-auto rounded-lg border border-brand-border bg-brand-card2 p-3 text-xs text-brand-sub">
                {providerResult.content || "(No content)"}
              </pre>
              <div className="mt-3 space-y-2">
                <p className="text-xs text-brand-sub">
                  {providerResult.diffs.length} file update
                  {providerResult.diffs.length === 1 ? "" : "s"}
                </p>
                {diffPreview.slice(0, 3).map((diff) => (
                  <div
                    key={diff.id}
                    className="rounded border border-brand-border bg-brand-card2 px-2 py-1 text-[11px] text-brand-sub"
                  >
                    {diff.summary}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  void acceptProvider(providerResult);
                }}
                disabled={acceptingProvider === providerResult.provider}
                className="mt-4 w-full rounded-lg bg-brand-gradient px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {acceptingProvider === providerResult.provider
                  ? "Applying..."
                  : `Accept ${providerTitle(providerResult.provider)} Result`}
              </button>
            </article>
          );
        })}
      </section>
    </main>
  );
}
