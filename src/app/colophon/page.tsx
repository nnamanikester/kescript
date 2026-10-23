import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { GH, GH_REPO_URL } from "@/lib/site";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";

export const metadata: Metadata = pageMetadata({
  title: "Colophon",
  path: "/colophon",
  socialTitle: "How this site works",
  description:
    "How kescript.com is built: GitHub issues as a free CMS and comment store, a unified + Shiki markdown pipeline, and Next.js 16 — with no database at all.",
});

const FLOW = [
  ["write", "Open an issue in the repo. The body is the post, in markdown, with optional frontmatter."],
  ["publish", `Add the "${GH.publishedLabels[0]}" label. A webhook revalidates the site within seconds.`],
  ["render", "unified parses the markdown; Shiki highlights code at build time; React renders the result."],
  ["discuss", "Comments and reactions are written back to the same issue through GitHub's GraphQL API, as the reader."],
];

const FRONTMATTER = `---
title: How I built an AI Slack assistant
subtitle: Retrieval, chunking, and not hallucinating
description: Shown in lists, search results and social cards.
slug: ai-slack-assistant      # default: slugified title
date: 2025-03-05              # default: when the issue was opened
updated: 2025-04-01
category: Essay               # or a "category:Essay" label
tags: [ai, rag, python]       # default: the issue's other labels
image: https://…/cover.png    # default: a generated card
canonical: https://…          # if it was published elsewhere first
featured: true                # or add a "featured" label
---`;

export default function ColophonPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-6">
      <PageHeader path="colophon" title="Colophon">
        <p>
          How this site works. There is no database and no CMS bill: posts, comments and reactions all live in{" "}
          <a href={`${GH_REPO_URL}/issues`} className="link">
            GitHub issues
          </a>
          , an idea borrowed from{" "}
          <a href="https://github.com/swyxio/swyxkit" className="link">
            swyxkit
          </a>
          .
        </p>
      </PageHeader>

      <section aria-labelledby="pipeline">
        <SectionTitle>
          <span id="pipeline">Pipeline</span>
        </SectionTitle>
        <ol className="space-y-4">
          {FLOW.map(([k, v], i) => (
            <li key={k} className="grid grid-cols-[5.5rem_1fr] gap-4">
              <span className="font-mono text-sm text-faint">
                <span className="text-accent">{i + 1}.</span> {k}
              </span>
              <span className="text-[0.975rem] leading-relaxed text-muted">{v}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16" aria-labelledby="frontmatter">
        <SectionTitle>
          <span id="frontmatter">Frontmatter</span>
        </SectionTitle>
        <p className="mb-4 text-[0.975rem] leading-relaxed text-muted">
          Everything is optional. Without it, the issue title, labels and creation date are used.
        </p>
        <pre className="overflow-x-auto rounded-xl border border-line bg-[var(--code-bg)] p-4 font-mono text-[0.8rem] leading-relaxed text-muted">
          {FRONTMATTER}
        </pre>
      </section>

      <section className="mt-16" aria-labelledby="markdown">
        <SectionTitle
          action={
            <Link href="/styleguide" className="font-mono text-xs text-faint hover:text-fg">
              style guide →
            </Link>
          }
        >
          <span id="markdown">Markdown</span>
        </SectionTitle>
        <p className="text-[0.975rem] leading-relaxed text-muted">
          GitHub-flavoured markdown plus: syntax highlighting with file titles, line numbers, line and word highlights,
          diffs and focus; tabbed code groups that remember your choice; automatic npm / pnpm / yarn / bun tabs; GitHub
          alerts; KaTeX maths; Mermaid diagrams; footnotes; YouTube and X embeds; and raw HTML. The{" "}
          <Link href="/styleguide" className="link">
            style guide
          </Link>{" "}
          shows every one of them.
        </p>
      </section>

      <section className="mt-16" aria-labelledby="stack">
        <SectionTitle>
          <span id="stack">Stack</span>
        </SectionTitle>
        <dl className="divide-y divide-line text-sm">
          {[
            ["Framework", "Next.js 16 (App Router, React Server Components, ISR)"],
            ["Content", "GitHub REST API · gray-matter"],
            ["Markdown", "unified · remark-gfm · rehype-pretty-code + Shiki · KaTeX · Mermaid"],
            ["Comments", "GitHub GraphQL API · GitHub App user tokens in an encrypted cookie"],
            ["Search", "uFuzzy, client-side, over full post text"],
            ["Styling", "Tailwind CSS 4 · Geist & Geist Mono"],
            ["Feeds", "RSS 2.0 and JSON Feed 1.1 with full content"],
            ["Hosting", "Vercel"],
          ].map(([k, v]) => (
            <div key={k} className="grid gap-1 py-2.5 sm:grid-cols-[8rem_1fr] sm:gap-6">
              <dt className="text-faint">{k}</dt>
              <dd className="font-mono text-[0.8rem] text-muted">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm text-faint">
          The source is on{" "}
          <a href={GH_REPO_URL} className="link">
            GitHub
          </a>
          . Fork it.
        </p>
      </section>
    </div>
  );
}
