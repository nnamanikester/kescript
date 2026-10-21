"use client";

/** Client side of /api/write/ai. Server types stay server-side; these mirror them. */
export type AiField = "title" | "description" | "tags";

export interface MetaSuggestion {
  title?: string;
  description?: string;
  tags?: string[];
}

export type AiRequest =
  | { task: "meta"; field: AiField; draft: object }
  | { task: "edit"; instruction: string; selection: string; before: string; after: string; title: string; slug: string };

export async function askAI<T>(body: AiRequest, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    // Backstop for a server that never answers; the server gives up well before this.
    const timeout = AbortSignal.timeout(150_000);
    res = await fetch("/api/write/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch (err) {
    if ((err as Error).name === "TimeoutError") throw new Error("The AI took too long to answer — try again");
    if ((err as Error).name === "AbortError") throw err;
    throw new Error("Couldn't reach the server");
  }
  const data = (await res.json().catch(() => ({}))) as T & { message?: string };
  if (!res.ok) throw new Error(data.message ?? `The AI request failed (${res.status})`);
  return data;
}
