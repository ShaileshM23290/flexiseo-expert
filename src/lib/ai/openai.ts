import OpenAI from "openai";
import { z } from "zod";
import { aiLimits, isOpenAIRetryEnabled } from "./config";

const DEFAULT_MODEL = "gpt-4o-mini";

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
}: {
  schema: z.ZodType<T>;
  schemaName: string;
  systemPrompt: string;
  userPrompt: string;
  fallback: T;
  normalize?: (raw: unknown, fallback: T) => T;
}): Promise<T> {
  const openai = getOpenAIClient();
  if (!openai) return fallback;

  const attempt = async (): Promise<T | null> => {
    try {
      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        temperature: 0.2,
        max_tokens: aiLimits.maxTokens,
        messages: [
          {
            role: "system",
            content: `${systemPrompt}\n\nAlways respond with valid JSON only. Be concise.`,
          },
          {
            role: "user",
            content: `${userPrompt}\n\nReturn valid JSON for ${schemaName}.`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return null;

      const raw = JSON.parse(content) as unknown;
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
  if (first) return first;

  if (!isOpenAIRetryEnabled()) return fallback;

  const retry = await attempt();
  return retry ?? fallback;
}
