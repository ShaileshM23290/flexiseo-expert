/** Strip optional markdown fences before parsing model JSON. */
export function stripJsonFence(content: string): string {
  const trimmed = content.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/i.exec(trimmed);
  return fence ? fence[1].trim() : trimmed;
}

export function parseModelJson(content: string): unknown {
  return JSON.parse(stripJsonFence(content)) as unknown;
}
