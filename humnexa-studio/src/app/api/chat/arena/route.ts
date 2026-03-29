import * as Sentry from "@sentry/nextjs";
import { z, ZodError } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { estimateCredits } from "@/lib/credits/estimate";
import { deductCreditsOnSuccess } from "@/lib/credits/deduct";
import { extractCodeDiffs } from "@/lib/ai/extract-diffs";
import type { RouterMessage } from "@/lib/ai/router";
import type { ProjectFile } from "@/types/studio";

const schema = z.object({
  projectId: z.string().uuid(),
  conversationId: z.string().uuid().nullable(),
  message: z.string().min(2),
  mode: z.enum(["agent", "plan"]).default("agent"),
  currentFiles: z.array(
    z.object({
      path: z.string(),
      content: z.string(),
      language: z.string().optional(),
      id: z.string().optional(),
      updatedAt: z.string().optional(),
    }),
  ),
});

type ProviderResult = {
  provider: "groq" | "claude" | "openai";
  content: string;
  tokenCount: number;
  diffs: Array<{ path: string; content: string }>;
};

async function readProviderText(
  provider: "groq" | "claude" | "openai",
  messages: RouterMessage[],
  system: string,
): Promise<ProviderResult> {
  if (provider === "groq") {
    if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY_MISSING");
    const { default: Groq } = await import("groq-sdk");
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL ?? "llama-3.1-70b-versatile",
      messages: [{ role: "system", content: system }, ...messages],
      stream: false,
      max_tokens: 4096,
    });
    const content = completion.choices?.[0]?.message?.content ?? "";
    const tokenCount = completion.usage?.total_tokens ?? 0;
    return { provider, content, tokenCount, diffs: [] };
  }

  if (provider === "claude") {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY_MISSING");
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5",
      max_tokens: 4096,
      system,
      messages: messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    });
    const text = response.content
      .map((part) => ("text" in part ? part.text : ""))
      .join("");
    const tokenCount = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);
    return { provider, content: text, tokenCount, diffs: [] };
  }

  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY_MISSING");
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [{ role: "system", content: system }, ...messages],
    stream: false,
    max_tokens: 4096,
  });
  const content = completion.choices?.[0]?.message?.content ?? "";
  const tokenCount = completion.usage?.total_tokens ?? 0;
  return { provider, content, tokenCount, diffs: [] };
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
    const mode = parsed.mode;
    if (mode === "plan") {
      return Response.json({ error: "Arena mode supports build mode only." }, { status: 400 });
    }

    const { data: project } = await supabase
      .from("projects")
      .select("name,framework,project_instructions")
      .eq("id", parsed.projectId)
      .eq("user_id", user.id)
      .maybeSingle();

    const typedProject = project as
      | { name?: string | null; framework?: string | null; project_instructions?: string | null }
      | null;

    const { data: settings } = await supabase
      .from("user_settings")
      .select("hindi_mode,workspace_knowledge")
      .eq("id", user.id)
      .maybeSingle();
    const typedSettings = settings as
      | { hindi_mode?: boolean; workspace_knowledge?: string | null }
      | null;

    const currentFilesForPrompt: ProjectFile[] = parsed.currentFiles.map((file) => ({
      id: file.id ?? `${parsed.projectId}:${file.path}`,
      path: file.path,
      content: file.content,
      language: file.language ?? "typescript",
      updatedAt: file.updatedAt ?? new Date().toISOString(),
    }));

    const systemPrompt = buildSystemPrompt(
      currentFilesForPrompt,
      "agent",
      typedProject?.name ?? "Arena Project",
      typedProject?.framework ?? "nextjs",
      {
        hindiMode: typedSettings?.hindi_mode ?? false,
        projectInstructions: typedProject?.project_instructions ?? "",
        workspaceKnowledge: typedSettings?.workspace_knowledge ?? "",
      },
    );

    const historyMessages: RouterMessage[] = [];
    if (parsed.conversationId) {
      const { data: rows } = await supabase
        .from("messages")
        .select("role,content")
        .eq("conversation_id", parsed.conversationId)
        .order("created_at", { ascending: true })
        .limit(20);
      historyMessages.push(
        ...((rows ?? [])
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })) as RouterMessage[]),
      );
    }

    const promptMessages: RouterMessage[] = [...historyMessages, { role: "user", content: parsed.message }];

    const arenaCost = estimateCredits(parsed.message, "agent") * 2;
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits_balance")
      .eq("id", user.id)
      .single();
    const balance = (profile as { credits_balance?: number | null } | null)?.credits_balance ?? 0;
    if (balance < arenaCost) {
      return Response.json(
        { error: "INSUFFICIENT_CREDITS", balance, required: arenaCost },
        { status: 402 },
      );
    }

    const rightProvider: "claude" | "openai" = process.env.ANTHROPIC_API_KEY ? "claude" : "openai";
    const [left, right] = await Promise.all([
      readProviderText("groq", promptMessages, systemPrompt),
      readProviderText(rightProvider, promptMessages, systemPrompt),
    ]);

    const leftDiffs = extractCodeDiffs(left.content, parsed.currentFiles).map((d) => ({
      path: d.filePath,
      content: d.after,
    }));
    const rightDiffs = extractCodeDiffs(right.content, parsed.currentFiles).map((d) => ({
      path: d.filePath,
      content: d.after,
    }));

    left.diffs = leftDiffs;
    right.diffs = rightDiffs;

    await deductCreditsOnSuccess(user.id, arenaCost, "Arena mode comparison");

    return Response.json({
      success: true,
      data: {
        creditsCharged: arenaCost,
        providers: [
          {
            provider: left.provider,
            content: left.content,
            tokenCount: left.tokenCount,
            diffs: left.diffs,
          },
          {
            provider: right.provider,
            content: right.content,
            tokenCount: right.tokenCount,
            diffs: right.diffs,
          },
        ],
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Validation failed" }, { status: 400 });
    }
    Sentry.captureException(error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Arena request failed" },
      { status: 500 },
    );
  }
}
