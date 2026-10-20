import { revalidateTag } from "next/cache";
import { json, readBody, withOwner } from "@/lib/api";
import { POSTS_TAG } from "@/lib/content";
import { validateDraft } from "@/lib/editor/draft";
import { createPost } from "@/lib/write";

/** New post: `publish: true` puts it on the blog, otherwise it's saved as a draft issue. */
export async function POST(req: Request) {
  return withOwner(req, async (session) => {
    const input = await readBody<{ publish?: boolean }>(req);
    const publishing = input?.publish === true;
    const result = validateDraft(input, { publishing });
    if ("error" in result) return json({ error: "invalid", message: result.error }, 400);
    const post = await createPost(session.token, result.draft, publishing ? "published" : "draft");
    if (publishing) revalidateTag(POSTS_TAG, { expire: 0 });
    return json(post, 201);
  });
}
