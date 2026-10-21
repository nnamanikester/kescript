import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Plus } from "lucide-react";
import { getPostMetas } from "@/lib/content";
import { GitHubError } from "@/lib/github";
import { authConfigured, getSession } from "@/lib/session";
import { formatDate, relativeTime } from "@/lib/utils";
import { isOwner, listDrafts, type DraftSummary } from "@/lib/write";
import { WriteSignIn } from "@/components/write/WriteSignIn";
import { DeleteDraftButton } from "@/components/write/DeleteDraftButton";

export const metadata: Metadata = { title: "Drafts", robots: { index: false, follow: false } };

function Row({ href, title, meta, external, action }: { href: string; title: string; meta: string; external?: string; action?: React.ReactNode }) {
  return (
    <li className="group flex items-baseline justify-between gap-4 py-3">
      <Link href={href} className="min-w-0 truncate text-fg group-hover:text-accent">
        {title || "Untitled"}
      </Link>
      <span className="flex shrink-0 items-center gap-3 font-mono text-xs text-faint">
        {meta}
        {external && (
          <a href={external} target="_blank" rel="noopener noreferrer" aria-label="Open the issue on GitHub" className="hover:text-fg">
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        )}
        {action}
      </span>
    </li>
  );
}

/** The author's desk: drafts on GitHub first, then everything already live. */
export default async function DraftsPage() {
  const session = await getSession();
  if (!session) return <WriteSignIn returnTo="/write/drafts" configured={authConfigured()} />;
  if (!isOwner(session.login)) notFound();

  let drafts: DraftSummary[] = [];
  let draftsError: string | null = null;
  try {
    drafts = await listDrafts(session.token);
  } catch (err) {
    draftsError = err instanceof GitHubError ? err.message : "Couldn't load drafts from GitHub";
  }
  const posts = (await getPostMetas()).filter((p) => p.issueNumber);

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-14 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-faint">
            <span className="text-accent">~</span>/write/drafts
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-fg">Your desk</h1>
        </div>
        <Link
          href="/write"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-fg pl-3.5 pr-4 text-sm font-medium text-bg transition-transform active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> New post
        </Link>
      </div>

      <section className="mt-12" aria-labelledby="drafts">
        <h2 id="drafts" className="label mb-3">
          Drafts on GitHub · {drafts.length}
        </h2>
        {draftsError ? (
          <p className="text-sm text-danger">{draftsError}</p>
        ) : drafts.length ? (
          <ul className="divide-y divide-line border-y border-line">
            {drafts.map((d) => (
              <Row
                key={d.number}
                href={`/write/${d.number}`}
                title={d.title}
                meta={`#${d.number} · edited ${relativeTime(d.updated)}`}
                external={d.url}
                action={<DeleteDraftButton number={d.number} title={d.title} />}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-faint">No drafts. “Save draft” in the editor puts one here.</p>
        )}
        <p className="mt-3 text-xs text-faint">
          Drafts are issues labelled <code>draft</code> in a public repo — readable on GitHub, never shown on the site. Unsaved work lives only in this
          browser until you save it.
        </p>
      </section>

      <section className="mt-14" aria-labelledby="published">
        <h2 id="published" className="label mb-3">
          Published · {posts.length}
        </h2>
        <ul className="divide-y divide-line border-y border-line">
          {posts.map((p) => (
            <Row key={p.slug} href={`/write/${p.issueNumber}`} title={p.title} meta={formatDate(p.date)} external={p.issueUrl} />
          ))}
        </ul>
      </section>
    </div>
  );
}
