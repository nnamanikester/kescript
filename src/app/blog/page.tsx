import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { Suspense } from "react";
import { MessageSquare } from "lucide-react";
import { getMostDiscussed, getSearchDocs } from "@/lib/content";
import { BlogIndex } from "@/components/blog/BlogIndex";
import { PostArchive } from "@/components/blog/PostRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { BlogJsonLd } from "@/components/site/JsonLd";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: "Writing",
  path: "/blog",
  socialTitle: "Writing — letters to a younger me",
  description:
    "Essays, tutorials and notes by John Nnamani on building things — software, habits and a life. Written for an earlier me, so you only learn them once. Fully searchable.",
});

export default async function BlogPage() {
  const [docs, discussed] = await Promise.all([getSearchDocs(), getMostDiscussed(3)]);
  const words = docs.reduce((n, d) => n + d.words, 0);

  const featured =
    discussed.length > 0 ? (
      <section aria-labelledby="most-discussed" data-spotlight className="mt-12 rounded-2xl border border-line bg-elev/70 p-5 sm:p-6">
        <h2 id="most-discussed" className="label mb-4">
          Most discussed
        </h2>
        <ol className="space-y-4">
          {discussed.map((p, i) => (
            <li key={p.slug} className="flex gap-4">
              <span className="font-mono text-sm text-faint">0{i + 1}</span>
              <div className="min-w-0">
                <Link href={`/blog/${p.slug}`} className="font-medium text-fg hover:text-accent">
                  {p.title}
                </Link>
                <p className="mt-0.5 flex items-center gap-3 font-mono text-xs text-faint">
                  <span>{p.reactionCount} reactions</span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {p.commentCount}
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    ) : null;

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-6">
      <BlogJsonLd posts={docs} />
      <PageHeader path="blog" title="Writing">
        <p>
          {docs.length} posts, roughly {Math.round(words / 1000)}k words. Long-form essays, step-by-step tutorials, and
          shorter notes I wrote mostly to understand something myself. Search everything, including the post bodies.
        </p>
      </PageHeader>

      <Suspense fallback={<PostArchive posts={docs} />}>
        <BlogIndex docs={docs} featured={featured} />
      </Suspense>
    </div>
  );
}
