import { revalidateTag } from "next/cache";
import { json, parseIssue, readBody, withOwner } from "@/lib/api";
import { POSTS_TAG } from "@/lib/content";
import { validateDraft } from "@/lib/editor/draft";
import { updatePost } from "@/lib/write";

/** Save a draft (`publish: false`), publish a draft, or update a live post (`publish: true`). */
export async function PATCH(req: Request, ctx: RouteContext<"/api/write/[issue]">) {
  return withOwner(req, async (session) => {
    const number = parseIssue((await ctx.params).issue);
    if (!number) return json({ error: "invalid", message: "Bad issue number" }, 400);
    const input = await readBody<{ publish?: boolean }>(req);
    // `publish: false` = save a draft as-is. Anything else goes live, so it gets the strict checks.
    const publishing = input?.publish !== false;
    const result = validateDraft(input, { publishing });
    if ("error" in result) return json({ error: "invalid", message: result.error }, 400);
    const post = await updatePost(session.token, number, result.draft, publishing ? "published" : undefined);
    // Draft autosaves arrive every few seconds and can't change the site.
    if (post.status === "published") revalidateTag(POSTS_TAG, { expire: 0 });
    return json(post);
  });
}
