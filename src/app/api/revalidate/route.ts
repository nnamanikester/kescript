import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { POSTS_TAG, waitForListing } from "@/lib/content";
import { threadTag } from "@/lib/github";
import { GH } from "@/lib/site";

type Label = string | { name?: string };
const isPublished = (labels: Label[] = []) =>
  labels.some((l) => (GH.publishedLabels as readonly string[]).includes(typeof l === "string" ? l : (l.name ?? "")));

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
  const payload = JSON.parse(raw) as {
    action?: string;
    issue?: { number: number; updated_at?: string; labels?: Label[] };
    label?: { name?: string };
  };
  if (event === "ping") return Response.json({ ok: true, pong: true });

  if (event === "issues") {
    // Draft autosaves edit issues every few seconds; only changes that can affect the blog bust the cache.
    const labelChange = payload.action === "labeled" || payload.action === "unlabeled";
    if (!labelChange && !isPublished(payload.issue?.labels)) return Response.json({ ok: true, event, skipped: "draft" });
    // GitHub's list lags its own webhook; rebuilding before it catches up would cache the old list.
    // GitHub gives a webhook 10s, so wait at most 8.
    if (payload.issue) {
      const { number, updated_at, labels } = payload.issue;
      const listed = payload.action !== "deleted" && isPublished(labels);
      await waitForListing({ number, updatedAt: updated_at }, listed, { timeoutMs: 8_000 });
    }
    revalidateTag(POSTS_TAG, { expire: 0 });
  }
  if (event === "label") revalidateTag(POSTS_TAG, "max");
  if (event === "issue_comment" && payload.issue) {
    revalidateTag(threadTag(payload.issue.number), { expire: 0 });
    revalidateTag(POSTS_TAG, "max");
  }
  return Response.json({ ok: true, event });
}
