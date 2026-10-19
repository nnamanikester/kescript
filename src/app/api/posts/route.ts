import { getSearchDocs } from "@/lib/content";

export const revalidate = 300;

/** Every post's metadata plus searchable text. Feeds the ⌘K palette. */
export async function GET() {
  return Response.json(await getSearchDocs(), {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" },
  });
}
