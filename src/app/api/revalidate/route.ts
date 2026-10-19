import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { POSTS_TAG } from "@/lib/content";
import { threadTag } from "@/lib/github";

/**
 * GitHub webhook (issues + issue_comment events). Publishing, editing or
 * labelling an issue shows up on the site within seconds instead of waiting
 * for the 5-minute revalidation window.
 */
export async function POST(req: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "Webhook secret not configured" }, { status: 501 });

  const raw = await req.text();
  const signature = req.headers.get("x-hub-signature-256") ?? "";
  const expected = "sha256=" + createHmac("sha256", secret).update(raw).digest("hex");
  const valid =
    signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return Response.json({ error: "Invalid signature" }, { status: 401 });

  const event = req.headers.get("x-github-event");
  const payload = JSON.parse(raw) as { issue?: { number: number } };
  if (event === "ping") return Response.json({ ok: true, pong: true });

  if (event === "issues" || event === "label") revalidateTag(POSTS_TAG, "max");
  if (event === "issue_comment" && payload.issue) {
    revalidateTag(threadTag(payload.issue.number), { expire: 0 });
    revalidateTag(POSTS_TAG, "max");
  }
  return Response.json({ ok: true, event });
}
