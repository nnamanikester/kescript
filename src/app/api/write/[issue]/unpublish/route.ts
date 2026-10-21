import { json, parseIssue, refreshPosts, withOwner } from "@/lib/api";
import { unpublishPost } from "@/lib/write";

/** Off the blog, back to drafts. The issue, its comments and reactions all stay. */
export async function POST(req: Request, ctx: RouteContext<"/api/write/[issue]">) {
  return withOwner(req, async (session) => {
    const number = parseIssue((await ctx.params).issue);
    if (!number) return json({ error: "invalid", message: "Bad issue number" }, 400);
    const post = await unpublishPost(session.token, number);
    await refreshPosts(post, false);
    return json(post);
  });
}
