import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostMetas, getTags } from "@/lib/content";
import { PostArchive } from "@/components/blog/PostRow";
import { PageHeader } from "@/components/ui/PageHeader";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getTags()).map(({ tag }) => ({ tag }));
}

export async function generateMetadata(props: PageProps<"/tags/[tag]">): Promise<Metadata> {
  const { tag } = await props.params;
  return { title: `#${tag}`, description: `Posts about ${tag}.`, alternates: { canonical: `/tags/${tag}` } };
}

export default async function TagPage(props: PageProps<"/tags/[tag]">) {
  const { tag } = await props.params;
  const posts = (await getPostMetas()).filter((p) => p.tags.includes(tag));
  if (!posts.length) notFound();
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-6">
      <PageHeader path={`tags/${tag}`} title={<span className="font-mono tracking-[-0.04em]">#{tag}</span>}>
        <p>
          {posts.length} post{posts.length === 1 ? "" : "s"}.{" "}
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
