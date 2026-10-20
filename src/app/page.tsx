import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import Image from "next/image";
import { ViewTransition } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getFeatured, getPostMetas, getTags } from "@/lib/content";
import { NOW, NOW_UPDATED } from "@/lib/data";
import { SITE } from "@/lib/site";
import { formatDate } from "@/lib/utils";
import { PostRow } from "@/components/blog/PostRow";
import { PostArt } from "@/components/ui/PostArt";
import { SectionTitle } from "@/components/ui/PageHeader";
import { Subscribe } from "@/components/site/Subscribe";
import { PaletteHint } from "@/components/site/PaletteHint";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: `John @${SITE.handle} Nnamani`,
  absoluteTitle: true,
  path: "/",
  socialTitle: `John @${SITE.handle} Nnamani`,
  kicker: "~/kescript",
  description: SITE.description,
});

export default async function Home() {
  const [featured, posts, tags] = await Promise.all([getFeatured(2), getPostMetas(), getTags()]);
  const latest = posts.slice(0, 6);

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-6">
      {/* ── Intro ─────────────────────────────────────────────────────── */}
      <section className="pb-20 pt-16 sm:pt-24">
        <Link
          href="/now"
          className="group inline-flex max-w-full items-center gap-2.5 rounded-full border border-line bg-elev/70 py-1 pl-1 pr-3.5 text-[0.8rem] text-muted shadow-card backdrop-blur transition-colors hover:border-line-strong hover:text-fg animate-fade-up"
        >
          <Image src="/images/profile.jpg" alt="" width={24} height={24} priority className="h-6 w-6 shrink-0 rounded-full object-cover" />
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ok pulse-dot" aria-hidden />
            <span className="truncate">Now: {NOW.building[0].split(" — ")[0]}</span>
          </span>
          <ArrowRight className="h-3 w-3 shrink-0 text-faint transition-transform group-hover:translate-x-0.5" />
        </Link>

        <h1
          className="mt-8 text-balance text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.045em] text-fg animate-fade-up sm:text-[3.6rem]"
          style={{ animationDelay: "60ms" }}
        >
          John{" "}
          <span className="font-serif text-[1.12em] font-normal italic tracking-[-0.02em] text-accent">@{SITE.handle}</span>{" "}
          Nnamani
        </h1>

        <div className="mt-7 max-w-[58ch] space-y-4 text-[1.0625rem] leading-relaxed text-muted animate-fade-up" style={{ animationDelay: "120ms" }}>
          <p>
            Letters to a younger me, sent a month or five years too late. I write about building things, like software,
            habits, and life, and mostly about the parts I had to learn twice, so you only have to learn them once.
            Still figuring it out (at least everyone is).
          </p>
        </div>

        <div className="mt-9 flex flex-wrap items-center gap-3 animate-fade-up" style={{ animationDelay: "180ms" }}>
          <Link
            href="/blog"
            className="group inline-flex h-10 items-center gap-2 rounded-full bg-fg pl-5 pr-4 text-sm font-medium text-bg transition-transform active:scale-[0.98]"
          >
            Read the writing
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/about"
            className="inline-flex h-10 items-center rounded-full border border-line bg-elev/60 px-5 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
          >
            About me
          </Link>
          <PaletteHint />
        </div>
      </section>

      {/* ── Start here ────────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section aria-labelledby="start-here">
          <SectionTitle>
            <span id="start-here">Start here</span>
          </SectionTitle>
          <ol className="grid gap-4 sm:grid-cols-2">
            {featured.map((p, i) => (
              <li key={p.slug}>
                <Link
                  href={`/blog/${p.slug}`}
                  data-spotlight
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-elev/60 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-line-strong"
                >
                  <ViewTransition name={`art-${p.slug}`} share="morph" default="none">
                    <div className="border-b border-line bg-elev">
                      <PostArt slug={p.slug} className="block aspect-[24/10] w-full" />
                    </div>
                  </ViewTransition>
                  <div className="flex flex-1 flex-col p-5">
                    <span className="font-mono text-[0.7rem] text-faint">
                      <span className="text-accent">{String(i + 1).padStart(2, "0")}</span> · {p.category} · {p.readingMinutes} min
                    </span>
                    <span className="mt-2.5 text-[1.1rem] font-medium leading-snug tracking-tight text-fg">{p.title}</span>
                    <span className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{p.description}</span>
                    <span className="mt-auto flex items-center gap-1 pt-5 font-mono text-xs text-faint transition-colors group-hover:text-accent">
                      read <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ── Latest ────────────────────────────────────────────────────── */}
      {latest.length > 0 && (
        <section aria-labelledby="latest" className="mt-20">
          <SectionTitle
            action={
              <Link href="/blog" className="font-mono text-xs text-faint transition-colors hover:text-fg">
                all {posts.length} posts →
              </Link>
            }
          >
            <span id="latest">Latest</span>
          </SectionTitle>
          <ul>
            {latest.map((p) => (
              <PostRow key={p.slug} post={p} showYear />
            ))}
          </ul>
        </section>
      )}

      {/* ── Topics + Now ──────────────────────────────────────────────── */}
      <div className="mt-20 grid gap-14 sm:grid-cols-2 sm:gap-10">
        {tags.length > 0 && (
          <section aria-labelledby="topics">
            <SectionTitle
              action={
                <Link href="/tags" className="font-mono text-xs text-faint transition-colors hover:text-fg">
                  all →
                </Link>
              }
            >
              <span id="topics">Topics</span>
            </SectionTitle>
            <ul className="flex flex-wrap gap-1.5">
              {tags.slice(0, 14).map(({ tag, count }) => (
                <li key={tag}>
                  <Link
                    href={`/tags/${tag}`}
                    className="inline-flex h-7 items-center gap-1.5 rounded-full border border-line px-2.5 font-mono text-[0.75rem] text-muted transition-colors hover:border-line-strong hover:bg-elev hover:text-fg"
                  >
                    #{tag}
                    <span className="text-[0.65rem] text-faint">{count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="now">
          <SectionTitle
            action={
              <Link href="/now" className="font-mono text-xs text-faint transition-colors hover:text-fg">
                /now →
              </Link>
            }
          >
            <span id="now">Now</span>
          </SectionTitle>
          <ul className="space-y-2.5">
            {[...NOW.building.slice(0, 2), NOW.learning[0]].map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                <span className="mt-[0.6rem] h-px w-2.5 shrink-0 bg-faint" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 font-mono text-[0.7rem] text-faint">updated {formatDate(NOW_UPDATED)}</p>
        </section>
      </div>

      {/* ── Principles ────────────────────────────────────────────────── */}
      <section aria-label="Principles" data-spotlight className="mt-20 rounded-2xl border border-line bg-elev/60 p-6 sm:p-8">
        <p className="font-serif text-[1.6rem] leading-snug tracking-tight text-fg sm:text-[1.9rem]">
          Measure before optimising. Ship small, ship often.{" "}
          <span className="italic text-muted">Write it down for whoever comes next.</span>
        </p>
        <Link href="/about" className="mt-5 inline-flex items-center gap-1 font-mono text-xs text-faint hover:text-fg">
          how I work <ArrowUpRight className="h-3 w-3" />
        </Link>
      </section>

      <div className="mt-20">
        <Subscribe />
      </div>
    </div>
  );
}
