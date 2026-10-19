import Link from "next/link";
import { Rss } from "lucide-react";
import { GitHubIcon } from "@/components/ui/brand-icons";
import { GH_REPO_URL, SITE } from "@/lib/site";

/**
 * Newsletter if Buttondown is configured (free tier, no database of our own);
 * otherwise the zero-infrastructure options: RSS and watching the repo.
 */
export function Subscribe({ compact = false }: { compact?: boolean }) {
  return (
    <section aria-labelledby="subscribe-title" className="rounded-2xl border border-line bg-elev p-6 sm:p-7">
      <h2 id="subscribe-title" className="font-semibold tracking-tight text-fg">
        Get new posts
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        {SITE.buttondown
          ? "Every new post by email, nothing else. One or two a month, unsubscribe in a click."
          : "No newsletter yet, no tracking, no algorithm. Pick your pipe."}
      </p>

      {SITE.buttondown ? (
        <form
          action={`https://buttondown.com/api/emails/embed-subscribe/${SITE.buttondown}`}
          method="post"
          target="_blank"
          className="mt-5 flex flex-col gap-2 sm:flex-row"
        >
          <label htmlFor="bd-email" className="sr-only">
            Email address
          </label>
          <input
            id="bd-email"
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@domain.dev"
            className="h-10 flex-1 rounded-lg border border-line bg-bg px-3.5 text-sm text-fg outline-none placeholder:text-faint focus:border-line-strong"
          />
          <button type="submit" className="h-10 rounded-lg bg-fg px-4 text-sm font-medium text-bg transition-opacity hover:opacity-90">
            Subscribe
          </button>
        </form>
      ) : null}

      <div className={`flex flex-wrap gap-2 ${SITE.buttondown ? "mt-3" : "mt-5"}`}>
        <a
          href="/rss.xml"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-[0.8rem] text-muted transition-colors hover:border-line-strong hover:text-fg"
        >
          <Rss className="h-3.5 w-3.5" /> RSS
        </a>
        <a
          href="/feed.json"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 font-mono text-[0.75rem] text-muted transition-colors hover:border-line-strong hover:text-fg"
        >
          {"{ }"} JSON Feed
        </a>
        <a
          href={`${GH_REPO_URL}/subscription`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-[0.8rem] text-muted transition-colors hover:border-line-strong hover:text-fg"
        >
          <GitHubIcon className="h-3.5 w-3.5" /> Watch on GitHub
        </a>
        {!compact && (
          <Link href="/subscribe" className="inline-flex h-8 items-center px-1 text-[0.8rem] text-faint hover:text-fg">
            more options →
          </Link>
        )}
      </div>
    </section>
  );
}
