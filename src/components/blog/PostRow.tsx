import Link from "next/link";
import type { ReactNode } from "react";
import type { PostMeta } from "@/lib/content";
import { compactNumber } from "@/lib/utils";

/** One line per post: date, title, category. Scannable like a changelog. */
export function PostRow({ post, snippet, showYear = false }: { post: PostMeta; snippet?: ReactNode; showYear?: boolean }) {
  return (
    <li>
      <Link
        href={`/blog/${post.slug}`}
        className="group -mx-3 grid grid-cols-[4.25rem_1fr] items-baseline gap-x-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-hover sm:grid-cols-[5.5rem_1fr_auto]"
      >
        <time dateTime={post.date} className="font-mono text-[0.78rem] tabular-nums text-faint">
          {showYear ? post.date.slice(0, 10) : post.date.slice(5, 10).replace("-", "/")}
        </time>
        <span className="min-w-0">
          <span className="text-[0.975rem] text-fg decoration-accent/60 underline-offset-4 group-hover:underline">{post.title}</span>
          {snippet && <span className="mt-1 block text-sm leading-relaxed text-faint">{snippet}</span>}
        </span>
        <span className="hidden font-mono text-[0.72rem] text-faint sm:block">
          {post.categoryName.toLowerCase()}
          {post.views ? (
            <span title={`${post.views.toLocaleString("en-US")} unique visitors`}> · {compactNumber(post.views)}</span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}

/** Grouped by year, newest first — the archive view. */
export function PostArchive({ posts }: { posts: PostMeta[] }) {
  const years = new Map<string, PostMeta[]>();
  for (const p of posts) {
    const y = p.date.slice(0, 4);
    years.set(y, [...(years.get(y) ?? []), p]);
  }
  return (
    <div className="space-y-10">
      {[...years].map(([year, list]) => (
        <section key={year} aria-labelledby={`y-${year}`}>
          <h3 id={`y-${year}`} className="mb-2 flex items-baseline gap-3 font-mono text-sm text-fg">
            {year}
            <span className="h-px flex-1 bg-line" aria-hidden />
            <span className="text-xs text-faint">{list.length}</span>
          </h3>
          <ul>
            {list.map((p) => (
              <PostRow key={p.slug} post={p} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
