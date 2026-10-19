import { getPost, getPostMetas } from "@/lib/content";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getPostMetas()).map((p) => ({ slug: p.slug }));
}

/** One post as JSON, markdown included. */
export async function GET(_req: Request, ctx: RouteContext<"/api/posts/[slug]">) {
  const post = await getPost((await ctx.params).slug);
  if (!post) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(post, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" } });
}
