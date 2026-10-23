import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pencil } from "lucide-react";
import "katex/dist/katex.min.css";
import { getPost, getPostMetas, getRelated, toMeta, type PostMeta } from "@/lib/content";
import { processPost } from "@/lib/markdown/pipeline";
import { FEEDS } from "@/lib/seo";
import { getPublicThread } from "@/lib/github";
import { SITE } from "@/lib/site";
import { formatDate } from "@/lib/utils";
import { PostBody } from "@/components/post/PostBody";
import { TableOfContents } from "@/components/post/TableOfContents";
import { ReadingHud } from "@/components/post/ReadingHud";
import { FootnotePreviews } from "@/components/post/FootnotePreviews";
import { PostArt } from "@/components/ui/PostArt";
import { ShareLinks } from "@/components/post/ShareLinks";
import { Discussion } from "@/components/discussion/Discussion";
import { ArticleJsonLd } from "@/components/site/JsonLd";
import { Subscribe } from "@/components/site/Subscribe";
import { EditPostLink } from "@/components/write/OwnerLinks";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getPostMetas()).map((p) => ({ slug: p.slug }));
}

function ogImage(post: PostMeta): string {
  if (post.image) return post.image;
  const q = new URLSearchParams({
    title: post.title,
    kicker: `~/blog/${post.category}`,
    meta: `${formatDate(post.date)} · ${post.readingMinutes} min read`,
  });
  return `/api/og?${q}`;
}

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = await getPost((await props.params).slug);
  if (!post) return {};
  const image = ogImage(post);
  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: post.canonical ?? `/blog/${post.slug}`, types: FEEDS },
    openGraph: {
      type: "article",
      siteName: SITE.name,
      locale: "en_US",
      section: post.categoryName,
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [SITE.author],
      tags: post.tags,
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
    },
    twitter: { card: "summary_large_image", creator: SITE.twitterHandle, title: post.title, description: post.description, images: [image] },
  };
}

export default async function PostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) notFound();

  const [{ tree, headings }, all, related, thread] = await Promise.all([
    processPost(post.body),
    getPostMetas(),
    getRelated(post, 3),
    post.issueNumber ? getPublicThread(post.issueNumber).catch(() => null) : Promise.resolve(null),
  ]);
  const i = all.findIndex((p) => p.slug === slug);
  const newer = i > 0 ? all[i - 1] : null;
  const older = i >= 0 && i < all.length - 1 ? all[i + 1] : null;
  const url = `${SITE.url}/blog/${post.slug}`;
  const ogUrl = ogImage(post);

  return (
    <>
      <ArticleJsonLd post={toMeta(post)} image={ogUrl.startsWith("http") ? ogUrl : SITE.url + ogUrl} />
      <ReadingHud headings={headings} title={post.title} />
      <FootnotePreviews rootId="article-body" />

      <article id="article" className="px-5 sm:px-6">
        <header className="relative measure pb-10 pt-12 sm:pt-16">
          <ViewTransition name={`art-${post.slug}`} share="morph" default="none">
            <div className="mb-10 overflow-hidden rounded-2xl border border-line bg-elev/70">
              <PostArt slug={post.slug} className="block aspect-[48/9] w-full opacity-90" cols={48} rows={9} />
            </div>
          </ViewTransition>
          <nav aria-label="Breadcrumb" className="font-mono text-xs text-faint">
            <Link href="/blog" className="hover:text-fg">
              <span className="text-accent">~</span>/blog
            </Link>
            <span>/</span>
            <Link href={`/blog?category=${post.category}`} className="hover:text-fg">
              {post.category}
            </Link>
          </nav>

          <h1 className="mt-4 text-balance text-[2.1rem] font-semibold leading-[1.12] tracking-[-0.035em] text-fg sm:text-[2.75rem]">
            {post.title}
          </h1>
          {(post.subtitle ?? post.description) && (
            <p className="mt-4 text-pretty text-lg leading-relaxed text-muted">{post.subtitle ?? post.description}</p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-line py-3.5 font-mono text-[0.75rem] text-faint">
            <Link href="/about" className="flex items-center gap-2 text-muted hover:text-fg">
              <Image src="/images/profile.jpg" alt="" width={20} height={20} className="h-5 w-5 rounded-full object-cover" />
              {SITE.author}
            </Link>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            {post.updated && post.updated !== post.date && <span>updated {formatDate(post.updated)}</span>}
            <span>{post.readingMinutes} min read</span>
            <span className="hidden sm:inline">{post.words.toLocaleString("en-US")} words</span>
            {post.issueNumber && (
              <span className="sm:ml-auto">
                <EditPostLink issueNumber={post.issueNumber} />
              </span>
            )}
            {post.commentCount > 0 && (
              <a href="#discussion" className="hover:text-fg">
                {post.commentCount} comment{post.commentCount === 1 ? "" : "s"}
              </a>
            )}
          </div>

          {post.canonical && (
            <p className="mt-6 rounded-lg border border-line bg-subtle px-4 py-3 text-sm text-muted">
              Originally published at{" "}
              <a href={post.canonical} className="link" target="_blank" rel="noopener noreferrer">
                {new URL(post.canonical).hostname}
              </a>
              .
            </p>
          )}
        </header>

        <div className="mx-auto xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,52rem)_minmax(0,1fr)] xl:gap-8">
          <div id="article-body" className="xl:col-start-2">
            <PostBody tree={tree} />
          </div>
          {headings.length >= 3 && (
            <aside className="hidden xl:block">
              <div className="sticky top-24 max-h-[calc(100dvh-8rem)] w-56 overflow-y-auto pb-8">
                <TableOfContents headings={headings} />
              </div>
            </aside>
          )}
        </div>

        <footer className="measure mt-16">
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
            {post.tags.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <li key={t}>
                    <Link
                      href={`/tags/${t}`}
                      className="inline-flex h-7 items-center rounded-full border border-line px-2.5 font-mono text-[0.75rem] text-muted transition-colors hover:border-line-strong hover:text-fg"
                    >
                      #{t}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {post.issueUrl && (
              <a
                href={post.issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-xs text-faint transition-colors hover:text-fg"
              >
                <Pencil className="h-3 w-3" /> suggest an edit
              </a>
            )}
          </div>

          <div className="mt-6">
            <ShareLinks url={url} title={post.title} />
          </div>

          {(older || newer) && (
            <nav aria-label="More posts" className="mt-14 grid gap-3 sm:grid-cols-2">
              {older ? (
                <Link href={`/blog/${older.slug}`} className="group rounded-xl border border-line p-4 transition-colors hover:border-line-strong hover:bg-hover">
                  <span className="flex items-center gap-1.5 font-mono text-[0.7rem] text-faint">
                    <ArrowLeft className="h-3 w-3" /> older
                  </span>
                  <span className="mt-1.5 block text-[0.95rem] text-fg">{older.title}</span>
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}
              {newer && (
                <Link
                  href={`/blog/${newer.slug}`}
                  className="group rounded-xl border border-line p-4 text-right transition-colors hover:border-line-strong hover:bg-hover"
                >
                  <span className="flex items-center justify-end gap-1.5 font-mono text-[0.7rem] text-faint">
                    newer <ArrowRight className="h-3 w-3" />
                  </span>
                  <span className="mt-1.5 block text-[0.95rem] text-fg">{newer.title}</span>
                </Link>
              )}
            </nav>
          )}

          {related.length > 0 && (
            <section aria-labelledby="related" className="mt-14">
              <h2 id="related" className="label mb-3">
                Related
              </h2>
              <ul className="divide-y divide-line border-y border-line">
                {related.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/blog/${p.slug}`} className="group flex items-baseline justify-between gap-4 py-3">
                      <span className="text-fg group-hover:text-accent">{p.title}</span>
                      <span className="shrink-0 font-mono text-xs text-faint">{p.categoryName.toLowerCase()}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-16">
            {post.issueNumber && post.issueUrl ? (
              <Discussion issueNumber={post.issueNumber} issueUrl={post.issueUrl} initial={thread} />
            ) : (
              <p className="text-sm text-faint">
                Comments are unavailable for this post.{" "}
                <a href={`mailto:${SITE.email}?subject=${encodeURIComponent(post.title)}`} className="link">
                  Email me instead <ArrowUpRight className="inline h-3 w-3" />
                </a>
              </p>
            )}
          </div>

          <div className="mt-16">
            <Subscribe />
          </div>
        </footer>
      </article>
    </>
  );
}
