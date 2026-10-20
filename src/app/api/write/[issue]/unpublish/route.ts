import { revalidateTag } from "next/cache";
import { json, parseIssue, withOwner } from "@/lib/api";
import { POSTS_TAG } from "@/lib/content";
import { unpublishPost } from "@/lib/write";

/** Off the blog, back to drafts. The issue, its comments and reactions all stay. */
export async function POST(req: Request, ctx: RouteContext<"/api/write/[issue]">) {
  return withOwner(req, async (session) => {
    const number = parseIssue((await ctx.params).issue);
    if (!number) return json({ error: "invalid", message: "Bad issue number" }, 400);
    const post = await unpublishPost(session.token, number);
    revalidateTag(POSTS_TAG, { expire: 0 });
    return json(post);
  });
}
