"use client";

export type DeleteOutcome = "deleted" | "closed";

export const DELETE_CONFIRM = "Delete this draft? This can't be undone.";

/** Delete a draft on GitHub. Throws with a message the UI can show. */
export async function requestDeleteDraft(number: number): Promise<DeleteOutcome> {
  let res: Response;
  try {
    res = await fetch(`/api/write/${number}`, { method: "DELETE" });
  } catch {
    throw new Error("Couldn't reach the server");
  }
  const data = (await res.json().catch(() => ({}))) as { outcome?: DeleteOutcome; message?: string };
  if (!res.ok || !data.outcome) throw new Error(data.message ?? `GitHub didn't accept that (${res.status})`);
  return data.outcome;
}

export function deletedMessage(outcome: DeleteOutcome): string {
  return outcome === "deleted" ? "Draft deleted" : "Draft removed — the issue is closed on GitHub";
}
