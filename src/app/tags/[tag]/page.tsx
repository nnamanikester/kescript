import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostMetas, getTags } from "@/lib/content";
import { PostArchive } from "@/components/blog/PostRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { MIN_POSTS_TO_INDEX_TAG, pageMetadata, tagLabel } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { TopicJsonLd } from "@/components/site/JsonLd";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getTags()).map(({ tag }) => ({ tag }));
}

export async function generateMetadata(props: PageProps<"/tags/[tag]">): Promise<Metadata> {
  const { tag } = await props.params;
  const posts = (await getPostMetas()).filter((p) => p.tags.includes(tag));
  const label = tagLabel(tag);
  const titles = posts.map((p) => p.title).join("; ");
  const lead = `${posts.length} post${posts.length === 1 ? "" : "s"} by ${SITE.author} about ${label}: `;
  const description = (lead + titles).length > 160 ? (lead + titles).slice(0, 157).replace(/\s+\S*$/, "") + "…" : lead + titles;
  return pageMetadata({
    title: `Posts about ${label}`,
    path: `/tags/${tag}`,
    socialTitle: `Writing about ${label}`,
    description,
    noindex: posts.length < MIN_POSTS_TO_INDEX_TAG,
  });
}

export default async function TagPage(props: PageProps<"/tags/[tag]">) {
  const { tag } = await props.params;
  const posts = (await getPostMetas()).filter((p) => p.tags.includes(tag));
  if (!posts.length) notFound();
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-6">
      <TopicJsonLd tag={tag} label={tagLabel(tag)} posts={posts} />
      <PageHeader path={`tags/${tag}`} title={tagLabel(tag)}>
        <p>
          {posts.length} post{posts.length === 1 ? "" : "s"} tagged <span className="font-mono text-fg">#{tag}</span>.{" "}
          <Link href="/tags" className="link">
            All topics
          </Link>{" "}
          ·{" "}
          <Link href={`/blog?tag=${tag}`} className="link">
            search within
          </Link>
        </p>
      </PageHeader>
      <PostArchive posts={posts} />
    </div>
  );
}
