import * as Sentry from "@sentry/nextjs";
import { ZodError, z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { buildPlanModePrompt } from "@/lib/ai/plan-mode-prompt";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { extractCodeDiffs } from "@/lib/ai/extract-diffs";
import { routeAI } from "@/lib/ai/router";
import { deductCreditsOnSuccess } from "@/lib/credits/deduct";
import { estimateCredits } from "@/lib/credits/estimate";

const schema = z.object({
  projectId: z.string().uuid(),
  conversationId: z.string().uuid().nullable(),
  message: z.string().min(2),
  mode: z.enum(["agent", "plan"]).default("agent"),
  planMode: z.boolean().optional(),
  currentFiles: z.array(
    z.object({
      id: z.string().optional(),
      path: z.string(),
      content: z.string(),
      language: z.string().default("typescript"),
      updatedAt: z.string().optional(),
    }),
  ),
});

async function snapshotBeforeGeneration(projectId: string): Promise<void> {
  const supabase = createSupabaseServer();
  const db = supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          order: (
            column: string,
            options?: { ascending?: boolean },
          ) => Promise<{
            data: Array<{ file_path: string; content: string }> | null;
          }>;
        };
      };
    };
  };
  const dbWriter = supabase as unknown as {
    from: (table: string) => {
      insert: (values: Record<string, unknown>) => Promise<unknown>;
    };
  };
  const { data: files } = await db
    .from("project_files")
    .select("file_path, content")
    .eq("project_id", projectId)
    .order("file_path", { ascending: true });
  const snapshot =
    files?.map((file) => ({
      path: file.file_path,
      content: file.content,
    })) ?? [];
  await dbWriter.from("project_versions").insert({
    project_id: projectId,
    label: `Snapshot ${new Date().toISOString()}`,
    snapshot,
    bookmarked: false,
  });
}

async function saveMessage(
  conversationId: string | null,
  role: "assistant" | "user",
  content: string,
  diffs: ReturnType<typeof extractCodeDiffs>,
  creditsUsed: number,
): Promise<void> {
  if (!conversationId) {
    return;
  }
  const supabase = createSupabaseServer();
  const dbWriter = supabase as unknown as {
    from: (table: string) => {
      insert: (values: Record<string, unknown>) => Promise<unknown>;
    };
  };
  await dbWriter.from("messages").insert({
    conversation_id: conversationId,
    role,
    content,
    code_diffs: diffs,
    credits_used: creditsUsed,
  });
}

export async function POST(req: Request): Promise<Response> {
  try {
    const supabase = createSupabaseServer();
    const dbWriter = supabase as unknown as {
      from: (table: string) => {
        upsert?: (values: Record<string, unknown>) => Promise<unknown>;
        update?: (values: Record<string, unknown>) => {
          eq: (column: string, value: string) => Promise<unknown>;
        };
      };
    };
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = schema.parse(await req.json());
    const planMode = parsed.planMode ?? parsed.mode === "plan";
    const estimatedCost = planMode ? 0 : estimateCredits(parsed.message, "agent");

    if (!planMode) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits_balance")
        .eq("id", user.id)
        .single();
      const typedProfile = profile as { credits_balance?: number | null } | null;
      const balance = typedProfile?.credits_balance ?? 0;
      if (balance < estimatedCost) {
        return Response.json(
          {
            error: "INSUFFICIENT_CREDITS",
            balance,
          },
          { status: 402 },
        );
      }
      await snapshotBeforeGeneration(parsed.projectId);
    }

    await saveMessage(parsed.conversationId, "user", parsed.message, [], 0);

    const currentFilesForPrompt = parsed.currentFiles.map((file) => ({
      id: file.id ?? `${parsed.projectId}:${file.path}`,
      path: file.path,
      content: file.content,
      language: file.language,
      updatedAt: file.updatedAt ?? new Date().toISOString(),
    }));

    const { data: settings } = await supabase
      .from("user_settings")
      .select("hindi_mode")
      .eq("id", user.id)
      .maybeSingle();
    const typedSettings = settings as { hindi_mode?: boolean } | null;
    const hindiMode = typedSettings?.hindi_mode ?? false;

    const systemPrompt =
      planMode
        ? buildPlanModePrompt()
        : buildSystemPrompt(
            currentFilesForPrompt,
            "agent",
            `Project ${parsed.projectId.slice(0, 8)}`,
            "nextjs",
            { hindiMode },
          );

    type HistoryMessage = { role: string; content: string };
    let conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
    if (parsed.conversationId) {
      const historyResponse = await supabase
        .from("messages")
        .select("role,content")
        .eq("conversation_id", parsed.conversationId)
        .order("created_at", { ascending: true })
        .limit(30);
      const history = (historyResponse.data as HistoryMessage[] | null) ?? [];
      conversationHistory =
        history
          ?.filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })) ?? [];
    }

    const { provider, result } = await routeAI(
      [...conversationHistory, { role: "user", content: parsed.message }],
      systemPrompt,
    );

    const encoder = new TextEncoder();
    let accumulatedText = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result as AsyncIterable<{ text: string }>) {
            const text = chunk.text ?? "";
            if (!text) continue;
            accumulatedText += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
            );
          }

          const diffs = planMode
            ? []
            : extractCodeDiffs(accumulatedText, parsed.currentFiles);

          if (parsed.conversationId && !planMode) {
            await dbWriter.from("conversations").update?.({
              updated_at: new Date().toISOString(),
            }).eq("id", parsed.conversationId);
          }

          await saveMessage(
            parsed.conversationId,
            "assistant",
            accumulatedText,
            diffs,
            planMode ? 0 : estimatedCost,
          );

          if (!planMode && estimatedCost > 0) {
            await deductCreditsOnSuccess(
              user.id,
              estimatedCost,
              "AI generation success",
            );
          }

          if (diffs.length > 0) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ diffs })}\n\n`,
              ),
            );
          }
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                provider,
              })}\n\n`,
            ),
          );

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                meta: {
                  creditsUsed: planMode ? 0 : estimatedCost,
                  planMode,
                  implementPrompt: planMode
                    ? "Implement this plan in build mode."
                    : null,
                },
              })}\n\n`,
            ),
          );

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          Sentry.captureException(error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Streaming failed" })}\n\n`,
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
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
