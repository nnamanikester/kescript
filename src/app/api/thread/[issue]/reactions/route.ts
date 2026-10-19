import { getPublicThread, setReaction } from "@/lib/github";
import { REACTION_KEYS, type ReactionKey } from "@/lib/reactions";
import { invalidateThread, json, parseIssue, readBody, withViewer } from "@/lib/api";

/** Toggle a reaction on the post (no subjectId) or on one of its comments. */
export async function POST(req: Request, ctx: RouteContext<"/api/thread/[issue]/reactions">) {
  const issue = parseIssue((await ctx.params).issue);
  if (!issue) return json({ error: "not_found" }, 404);
  return withViewer(req, async (session) => {
    const input = await readBody<{ subjectId?: string; content?: string; on?: boolean }>(req);
    if (!input?.content || !REACTION_KEYS.has(input.content) || typeof input.on !== "boolean") {
      return json({ error: "invalid" }, 400);
    }
    let subjectId = input.subjectId;
    if (!subjectId) {
      const thread = await getPublicThread(issue);
      if (!thread) return json({ error: "not_found" }, 404);
      subjectId = thread.issueId;
    }
    const reactions = await setReaction(subjectId, input.content as ReactionKey, input.on, session.token);
    invalidateThread(issue);
    return json({ subjectId, reactions });
  });
}
