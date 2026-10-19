import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getFeatured, getPostMetas, getTags } from "@/lib/content";
import { NOW, NOW_UPDATED } from "@/lib/data";
import { SITE } from "@/lib/site";
import { formatDate } from "@/lib/utils";
import { PostRow } from "@/components/blog/PostRow";
import { SectionTitle } from "@/components/ui/PageHeader";
import { Subscribe } from "@/components/site/Subscribe";

export const revalidate = 300;

export default async function Home() {
  const [featured, posts, tags] = await Promise.all([getFeatured(4), getPostMetas(), getTags()]);
  const featuredSlugs = new Set(featured.map((p) => p.slug));
  const recent = posts.filter((p) => !featuredSlugs.has(p.slug)).slice(0, 6);

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-6">
      {/* ── Intro ─────────────────────────────────────────────────────── */}
      <section className="relative pb-16 pt-16 sm:pt-24">
        <div className="bg-grid pointer-events-none absolute inset-x-[-20vw] -top-14 bottom-0 -z-10" aria-hidden />
        <div className="flex items-center gap-3 animate-fade-up">
          <Image
            src="/images/profile.jpg"
            alt={SITE.author}
            width={44}
            height={44}
            priority
            className="h-11 w-11 rounded-full border border-line object-cover"
          />
          <div className="font-mono text-xs leading-relaxed text-faint">
            <p className="text-fg">{SITE.author}</p>
            <p>software engineer · {SITE.location}</p>
          </div>
        </div>

        <h1
          className="mt-8 text-balance text-[2.25rem] font-semibold leading-[1.08] tracking-[-0.04em] text-fg animate-fade-up sm:text-[3.1rem]"
          style={{ animationDelay: "60ms" }}
        >
          Notes to a younger me, on building software.
        </h1>

        <div className="mt-6 max-w-[60ch] space-y-4 text-[1.0625rem] leading-relaxed text-muted animate-fade-up" style={{ animationDelay: "120ms" }}>
          <p>
            Since 2018 I&apos;ve shipped React Native apps for logistics, payments, real-time calling and meditation —
            mostly learning that the interesting problems live at the edges: slow phones, flaky networks, release
            pipelines, and ledgers that have to add up. Lately I work on systems with a language model somewhere in the
            loop.
          </p>
          <p>
            Everything here is written for an earlier version of me — five years ago or last month — and for anyone
            standing where I stood. Start with the{" "}
            <Link href="/blog" className="link">
              writing
            </Link>
            , see what I&apos;m doing{" "}
            <Link href="/now" className="link">
              now
            </Link>
            , or read{" "}
            <Link href="/about" className="link">
              more about me
            </Link>
            .
          </p>
        </div>

        <p className="mt-8 border-l-2 border-accent pl-4 font-mono text-[0.8rem] leading-relaxed text-faint animate-fade-up" style={{ animationDelay: "180ms" }}>
          measure before optimising.
          <br />
          ship small, ship often.
          <br />
          write it down for whoever comes next.
        </p>
      </section>

      {/* ── Start here ────────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section aria-labelledby="start-here" className="mt-4">
          <SectionTitle>
            <span id="start-here">Start here</span>
          </SectionTitle>
          <ol className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {featured.map((p, i) => (
              <li key={p.slug} className="bg-bg">
                <Link href={`/blog/${p.slug}`} className="group flex h-full flex-col p-5 transition-colors hover:bg-hover">
                  <span className="font-mono text-xs text-faint">
                    <span className="text-accent">{String(i + 1).padStart(2, "0")}</span> · {p.category} · {p.readingMinutes} min
                  </span>
                  <span className="mt-3 text-[1.05rem] font-medium leading-snug tracking-tight text-fg">{p.title}</span>
                  <span className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{p.description}</span>
                  <span className="mt-auto flex items-center gap-1 pt-4 font-mono text-xs text-faint transition-colors group-hover:text-accent">
                    read <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ── Recently ──────────────────────────────────────────────────── */}
      {recent.length > 0 && (
        <section aria-labelledby="recent" className="mt-20">
          <SectionTitle
            action={
              <Link href="/blog" className="font-mono text-xs text-faint transition-colors hover:text-fg">
                all {posts.length} posts →
              </Link>
            }
          >
            <span id="recent">Recently</span>
          </SectionTitle>
          <ul>
            {recent.map((p) => (
              <PostRow key={p.slug} post={p} showYear />
            ))}
          </ul>
        </section>
      )}

      {/* ── Topics ────────────────────────────────────────────────────── */}
      {tags.length > 0 && (
        <section aria-labelledby="topics" className="mt-20">
          <SectionTitle
            action={
              <Link href="/tags" className="font-mono text-xs text-faint transition-colors hover:text-fg">
                all topics →
              </Link>
            }
          >
            <span id="topics">Topics</span>
          </SectionTitle>
          <ul className="flex flex-wrap gap-2">
            {tags.slice(0, 18).map(({ tag, count }) => (
              <li key={tag}>
                <Link
                  href={`/tags/${tag}`}
                  className="inline-flex h-8 items-center gap-2 rounded-lg border border-line px-3 font-mono text-[0.8rem] text-muted transition-colors hover:border-line-strong hover:text-fg"
                >
                  #{tag}
                  <span className="text-[0.7rem] text-faint">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Now ───────────────────────────────────────────────────────── */}
      <section aria-labelledby="now" className="mt-20">
        <SectionTitle
          action={
            <Link href="/now" className="font-mono text-xs text-faint transition-colors hover:text-fg">
              /now →
            </Link>
          }
        >
          <span id="now">Now</span>
        </SectionTitle>
        <div className="grid gap-8 sm:grid-cols-2">
          {(
            [
              ["Building", NOW.building],
              ["Learning", NOW.learning],
            ] as const
          ).map(([label, items]) => (
            <div key={label}>
              <p className="flex items-center gap-2 text-sm font-medium text-fg">
                {label === "Building" && <span className="h-1.5 w-1.5 rounded-full bg-ok pulse-dot" aria-hidden />}
                {label}
              </p>
              <ul className="mt-3 space-y-2.5">
                {items.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                    <span className="mt-[0.6rem] h-px w-2.5 shrink-0 bg-faint" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-6 font-mono text-[0.7rem] text-faint">last updated {formatDate(NOW_UPDATED)}</p>
      </section>

      <div className="mt-20">
        <Subscribe />
      </div>
    </div>
  );
}
