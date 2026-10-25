/**
 * Unique visitor counts from GoatCounter's public counter endpoint
 * (Settings → "Allow adding visitor counts on your website").
 *
 * Its stats API would fetch every post in one call, but it returns hourly
 * breakdowns for every day in the range, so an all-time query grows without
 * bound. One small cached request per post stays tiny.
 */
import { cache } from "react";

const CODE = process.env.NEXT_PUBLIC_GOATCOUNTER_CODE;
/** GoatCounter caches counter responses for up to four hours anyway. */
const REVALIDATE_SECONDS = 3600;
const CONCURRENCY = 6;

export const postPath = (slug: string) => `/blog/${slug}`;

/** Visitors for one path; 0 if it was never visited, null when unknown. */
export async function getViews(path: string): Promise<number | null> {
  if (!CODE) return null;
  try {
    const res = await fetch(`https://${CODE}.goatcounter.com/counter/${encodeURIComponent(path)}.json`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (res.status === 404) return 0;
    if (!res.ok) return null;
    // A formatted string: "1,234".
    const { count } = (await res.json()) as { count?: string };
    const digits = String(count ?? "").replace(/\D/g, "");
    return digits ? Number(digits) : null;
  } catch {
    return null;
  }
}

/** Visitors per slug; slugs with no known count are left out. */
export const getPostViews = cache(async (slugs: string[]): Promise<Record<string, number>> => {
  if (!CODE) return {};
  const out: Record<string, number> = {};
  for (let i = 0; i < slugs.length; i += CONCURRENCY) {
    const batch = slugs.slice(i, i + CONCURRENCY);
    const counts = await Promise.all(batch.map((s) => getViews(postPath(s))));
    batch.forEach((s, j) => {
      if (counts[j] != null) out[s] = counts[j];
    });
  }
  return out;
});
