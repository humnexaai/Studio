import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";
import OpenAI from "openai";

export type RouterMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ProviderName = "groq" | "claude" | "openai";

const failures = new Map<ProviderName, number[]>();

function prune(entries: number[]): number[] {
  const now = Date.now();
  return entries.filter((ts) => now - ts <= 60_000);
}

function isCircuitOpen(provider: ProviderName): boolean {
  const entries = prune(failures.get(provider) ?? []);
  failures.set(provider, entries);
  return entries.length >= 5;
}

function recordFailure(provider: ProviderName): void {
  const next = prune([...(failures.get(provider) ?? []), Date.now()]);
  failures.set(provider, next);
}

function resetCircuit(provider: ProviderName): void {
  failures.delete(provider);
}

async function callProvider(
  provider: ProviderName,
  messages: RouterMessage[],
  system: string,
) {
  const groqClient = process.env.GROQ_API_KEY
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;
  const anthropicClient = process.env.ANTHROPIC_API_KEY
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null;
  const openaiClient = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

  const merged = [{ role: "system", content: system } as const, ...messages];

  if (provider === "groq") {
    if (!groqClient) {
      throw new Error("GROQ_API_KEY_MISSING");
    }
    return groqClient.chat.completions.create({
      model: process.env.GROQ_MODEL ?? "llama-3.1-70b-versatile",
      stream: true,
      messages: merged,
    });
  }

  if (provider === "claude") {
    if (!anthropicClient) {
      throw new Error("ANTHROPIC_API_KEY_MISSING");
    }
    const stream = await anthropicClient.messages.stream({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5",
      max_tokens: 4096,
      system,
      messages: messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    });
    return stream;
  }

  if (!openaiClient) {
    throw new Error("OPENAI_API_KEY_MISSING");
  }
  return openaiClient.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    stream: true,
    messages: merged,
  });
}

export async function routeAI(messages: RouterMessage[], system: string) {
  const providers: ProviderName[] = ["groq", "claude", "openai"];

  for (const provider of providers) {
    if (isCircuitOpen(provider)) continue;
    try {
      const result = await callProvider(provider, messages, system);
      resetCircuit(provider);
      return { provider, result } as const;
    } catch (error) {
      recordFailure(provider);
      if (process.env.NODE_ENV !== "production") {
        console.error(`Provider ${provider} failed`, error);
      }
    }
  }

  throw new Error("ALL_AI_PROVIDERS_FAILED");
}
