/** Helpers for reading a model's reply. */

/** The JSON in a reply, even when the model wrapped it in prose or a code fence. Throws when there is none. */
export function parseJSON<T>(reply: string): T {
  const fenced = reply.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const text = fenced ?? reply;
  const start = text.search(/[[{]/);
  if (start === -1) throw new Error("The model didn't return JSON");
  const end = text.lastIndexOf(text[start] === "{" ? "}" : "]");
  return JSON.parse(text.slice(start, end + 1)) as T;
}

/** The reply without a code fence wrapped around the whole of it. */
export function unfence(reply: string): string {
  const match = reply.trim().match(/^```[\w-]*\n([\s\S]*?)\n?```$/);
  return (match ? match[1] : reply).trim();
}
