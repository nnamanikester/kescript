import { getPublicThread, getViewerThread, GitHubError } from "@/lib/github";
import { getSession } from "@/lib/session";
import { json, parseIssue } from "@/lib/api";

export async function GET(_req: Request, ctx: RouteContext<"/api/thread/[issue]">) {
  const issue = parseIssue((await ctx.params).issue);
  if (!issue) return json({ error: "not_found" }, 404);

  const session = await getSession();
  if (session) {
    try {
      const thread = await getViewerThread(issue, session.token);
      return thread ? json(thread, 200, { "Cache-Control": "private, no-store" }) : json({ error: "not_found" }, 404);
    } catch (err) {
      // Expired reader token: fall through to the public view rather than failing.
      if (!(err instanceof GitHubError && err.status === 401)) throw err;
    }
  }

  const thread = await getPublicThread(issue);
  return thread
    ? json(thread, 200, { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" })
    : json({ error: "not_found" }, 404);
}
