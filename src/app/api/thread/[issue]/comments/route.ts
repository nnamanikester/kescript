import { addComment, deleteComment, getPublicThread, updateComment } from "@/lib/github";
import { invalidateThread, json, MAX_COMMENT_LENGTH, parseIssue, readBody, withViewer } from "@/lib/api";

type Ctx = RouteContext<"/api/thread/[issue]/comments">;

function validBody(body: unknown): body is string {
  return typeof body === "string" && body.trim().length > 0 && body.length <= MAX_COMMENT_LENGTH;
}

export async function POST(req: Request, ctx: Ctx) {
  const issue = parseIssue((await ctx.params).issue);
  if (!issue) return json({ error: "not_found" }, 404);
  return withViewer(req, async (session) => {
    const input = await readBody<{ body?: string }>(req);
    if (!validBody(input?.body)) return json({ error: "invalid", message: "Comment can't be empty" }, 400);
    // Resolve the subject server-side so this endpoint can only ever comment on blog posts.
    const thread = await getPublicThread(issue);
    if (!thread) return json({ error: "not_found" }, 404);
    if (thread.locked) return json({ error: "locked", message: "Comments are closed on this post" }, 403);
    const comment = await addComment(thread.issueId, input.body, session.token);
    invalidateThread(issue);
    return json(comment, 201);
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const issue = parseIssue((await ctx.params).issue);
  if (!issue) return json({ error: "not_found" }, 404);
  return withViewer(req, async (session) => {
    const input = await readBody<{ id?: string; body?: string }>(req);
    if (typeof input?.id !== "string" || !validBody(input.body)) return json({ error: "invalid" }, 400);
    const comment = await updateComment(input.id, input.body, session.token);
    invalidateThread(issue);
    return json(comment);
  });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const issue = parseIssue((await ctx.params).issue);
  if (!issue) return json({ error: "not_found" }, 404);
  return withViewer(req, async (session) => {
    const input = await readBody<{ id?: string }>(req);
    if (typeof input?.id !== "string") return json({ error: "invalid" }, 400);
    await deleteComment(input.id, session.token);
    invalidateThread(issue);
    return json({ ok: true });
  });
}
