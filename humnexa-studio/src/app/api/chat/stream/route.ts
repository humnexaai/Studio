import * as Sentry from "@sentry/nextjs";
import { ZodError, z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { buildPlanModePrompt } from "@/lib/ai/plan-mode-prompt";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { extractCodeDiffs } from "@/lib/ai/extract-diffs";
import { routeAI } from "@/lib/ai/router";
import { deductCreditsOnSuccess, estimateCredits } from "@/lib/credits/deduct";
import { preFlightCheck } from "@/lib/credits/preflight";
import { refundCreditsOnFailure } from "@/lib/credits/refund";
import type { ProjectFile } from "@/types/studio";

const schema = z.object({
  projectId: z.string().uuid(),
  conversationId: z.string().uuid().nullable(),
  message: z.string().min(2),
  mode: z.enum(["agent", "plan"]).default("agent"),
  currentFiles: z.array(
    z.object({
      id: z.string(),
      path: z.string(),
      content: z.string(),
      language: z.string().default("typescript"),
      updatedAt: z.string(),
    }),
  ),
});

const fixAttempts = new Map<string, number>();

function detectLoop(projectId: string, errorHash: string): {
  blocked: boolean;
  message?: string;
  refundCredits?: boolean;
} {
  const key = `${projectId}:${errorHash}`;
  const n = (fixAttempts.get(key) ?? 0) + 1;
  fixAttempts.set(key, n);
  if (n >= 3) {
    return {
      blocked: true,
      message: "AI has tried 3 times. Manual fix needed.",
      refundCredits: true,
    };
  }
  return { blocked: false };
}

async function snapshotBeforeGeneration(
  projectId: string,
  files: ProjectFile[],
): Promise<void> {
  const supabase = createSupabaseServer();
  await supabase.from("project_versions").insert({
    project_id: projectId,
    label: `Snapshot ${new Date().toISOString()}`,
    snapshot: files,
    bookmarked: false,
  });
}

async function saveMessage(
  conversationId: string | null,
  role: "assistant" | "user",
  content: string,
  diffs: ReturnType<typeof extractCodeDiffs>,
): Promise<void> {
  if (!conversationId) {
    return;
  }
  const supabase = createSupabaseServer();
  await supabase.from("messages").insert({
    conversation_id: conversationId,
    role,
    content,
    code_diffs: diffs,
    credits_used: 0,
  });
}

export async function POST(req: Request): Promise<Response> {
  try {
    const supabase = createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = schema.parse(await req.json());
    const estimatedCost = estimateCredits(parsed.message, parsed.mode);
    await preFlightCheck(user.id, estimatedCost);
    await snapshotBeforeGeneration(parsed.projectId, parsed.currentFiles);

    const systemPrompt =
      parsed.mode === "plan"
        ? buildPlanModePrompt()
        : buildSystemPrompt(
            parsed.currentFiles,
            parsed.mode,
            `Project ${parsed.projectId.slice(0, 8)}`,
            "nextjs",
          );

    const { result } = await routeAI(
      [{ role: "user", content: parsed.message }],
      systemPrompt,
    );

    const encoder = new TextEncoder();
    let accumulatedText = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result as AsyncIterable<{
            choices?: Array<{ delta?: { content?: string } }>;
            delta?: { text?: string };
          }>) {
            const text =
              chunk.choices?.[0]?.delta?.content ?? chunk.delta?.text ?? "";
            if (!text) continue;
            accumulatedText += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
            );
          }

          const loopResult = detectLoop(parsed.projectId, accumulatedText.slice(0, 40));
          if (loopResult.blocked) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ warning: loopResult.message })}\n\n`,
              ),
            );
            if (loopResult.refundCredits && estimatedCost > 0) {
              await refundCreditsOnFailure(user.id, estimatedCost, "Fix loop detected");
            }
          } else {
            const diffs = extractCodeDiffs(accumulatedText);
            await saveMessage(
              parsed.conversationId,
              "assistant",
              accumulatedText,
              diffs,
            );

            if (parsed.mode === "agent" && estimatedCost > 0) {
              await deductCreditsOnSuccess(
                user.id,
                estimatedCost,
                "AI generation success",
              );
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          Sentry.captureException(error);
          if (parsed.mode === "agent" && estimatedCost > 0) {
            await refundCreditsOnFailure(user.id, estimatedCost, "AI generation failure");
          }
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
