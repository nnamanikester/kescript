import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { NOW, NOW_UPDATED } from "@/lib/data";
import { SITE } from "@/lib/site";
import { formatDate } from "@/lib/utils";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";

export const metadata: Metadata = pageMetadata({
  title: "Now",
  path: "/now",
  socialTitle: `What ${SITE.author} is doing now`,
  description: `What ${SITE.author} is building, learning and writing about right now — AI developer tooling, RAG pipelines and agentic patterns. A /now page, updated by hand.`,
});

export default function NowPage() {
  const sections = [
    ["Building", NOW.building],
    ["Learning", NOW.learning],
    ["Writing", NOW.writing],
  ] as const;

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-6">
      <PageHeader path="now" title="Now">
        <p>
          What I&apos;m focused on at the moment — a{" "}
          <a href="https://nownownow.com/about" className="link" target="_blank" rel="noopener noreferrer">
            /now page
          </a>
          . If you&apos;re reading this long after the date below, assume it has drifted.
        </p>
      </PageHeader>

      <p className="mb-12 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 font-mono text-xs text-faint">
        <span className="h-1.5 w-1.5 rounded-full bg-ok pulse-dot" aria-hidden />
        updated {formatDate(NOW_UPDATED)} · {SITE.location}
      </p>

      <div className="space-y-14">
        {sections.map(([title, items]) => (
          <section key={title} aria-label={title}>
            <SectionTitle>{title}</SectionTitle>
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item} className="flex gap-3 text-[1.0625rem] leading-relaxed text-muted">
                  <span className="mt-[0.85rem] h-px w-3 shrink-0 bg-faint" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-16 text-sm text-faint">
        Older context lives on the <Link href="/about" className="link">about page</Link>; the tools I use are on{" "}
        <Link href="/uses" className="link">/uses</Link>.
      </p>
    </div>
  );
}
