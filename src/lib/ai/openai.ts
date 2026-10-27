import OpenAI from "openai";
import { z } from "zod";
import { aiLimits, getOpenAIModel, isOpenAIRetryEnabled, isReasoningModel } from "./config";
import { parseModelJson } from "./parse-json";

export type StructuredResponseResult<T> = {
  data: T;
  /** False when the API failed, JSON was invalid/truncated, or validation failed without normalize. */
  ok: boolean;
};

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  if (!client) {
    client = new OpenAI({ apiKey });
  }
  return client;
}

export function isOpenAIAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function logValidationFailure(schemaName: string, error: z.ZodError) {
  const fields = [...new Set(error.issues.map((i) => i.path.join(".")))].slice(0, 5);
  console.warn(`[AI] Validation failed (${schemaName}): ${fields.join(", ")}`);
}

export async function generateStructuredResponse<T>({
  schema,
  schemaName,
  systemPrompt,
  userPrompt,
  fallback,
  normalize,
  maxTokens,
}: {
  schema: z.ZodType<T>;
  schemaName: string;
  systemPrompt: string;
  userPrompt: string;
  fallback: T;
  normalize?: (raw: unknown, fallback: T) => T;
  /** Override default max output tokens (e.g. large batch payloads). */
  maxTokens?: number;
}): Promise<T> {
  const { data } = await generateStructuredResponseResult({
    schema,
    schemaName,
    systemPrompt,
    userPrompt,
    fallback,
    normalize,
    maxTokens,
  });
  return data;
}

export async function generateStructuredResponseResult<T>({
  schema,
  schemaName,
  systemPrompt,
  userPrompt,
  fallback,
  normalize,
  maxTokens,
}: {
  schema: z.ZodType<T>;
  schemaName: string;
  systemPrompt: string;
  userPrompt: string;
  fallback: T;
  normalize?: (raw: unknown, fallback: T) => T;
  maxTokens?: number;
}): Promise<StructuredResponseResult<T>> {
  const openai = getOpenAIClient();
  if (!openai) return { data: fallback, ok: false };

  const outputTokenLimit = maxTokens ?? aiLimits.maxTokens;
  const model = getOpenAIModel();

  const attempt = async (): Promise<T | null> => {
    try {
      const response = await openai.chat.completions.create({
        model,
        ...(isReasoningModel(model) ? { reasoning_effort: "none" as const } : {}),
        temperature: 0.2,
        max_completion_tokens: outputTokenLimit,
        messages: [
          {
            role: "system",
            content: `${systemPrompt}\n\nAlways respond with valid JSON only. Be concise — short sentences, no markdown.`,
          },
          {
            role: "user",
            content: `${userPrompt}\n\nReturn valid JSON for ${schemaName}.`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const choice = response.choices[0];
      const content = choice?.message?.content;
      if (!content) return null;

      if (choice?.finish_reason === "length") {
        console.warn(
          `[AI] Output truncated (${schemaName}) — max_tokens=${outputTokenLimit}; retry or split the request`
        );
      }

      let raw: unknown;
      try {
        raw = parseModelJson(content);
      } catch (error) {
        console.warn(
          `[AI] Invalid JSON (${schemaName}):`,
          error instanceof Error ? error.message : error
        );
        return null;
      }

      const candidate = normalize ? normalize(raw, fallback) : raw;
      const parsed = schema.safeParse(candidate);

      if (parsed.success) return parsed.data;

      if (normalize) return candidate as T;

      logValidationFailure(schemaName, parsed.error);
      return null;
    } catch (error) {
      console.warn(
        `[AI] Request failed (${schemaName}):`,
        error instanceof Error ? error.message : error
      );
      return null;
    }
  };

  const first = await attempt();
  if (first) return { data: first, ok: true };

  if (!isOpenAIRetryEnabled()) return { data: fallback, ok: false };

  const retry = await attempt();
  if (retry) return { data: retry, ok: true };

  return { data: fallback, ok: false };
}
