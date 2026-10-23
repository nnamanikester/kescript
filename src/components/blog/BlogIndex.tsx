"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import uFuzzy from "@leeoniya/ufuzzy";
import { Search, X } from "lucide-react";
import type { SearchDoc } from "@/lib/content";
import { PostArchive, PostRow } from "./PostRow";

const uf = new uFuzzy({ intraMode: 1, intraIns: 1 });
const PAGE = 25;

function haystackOf(d: SearchDoc) {
  return `${d.title} · ${d.description} · ${d.tags.map((t) => "#" + t).join(" ")} · ${d.text}`;
}

/** A ~200 char window around the first match, with matches wrapped in <mark>. */
function snippet(hay: string, ranges: number[]): ReactNode {
  const first = ranges[0] ?? 0;
  const start = Math.max(0, hay.lastIndexOf(" ", Math.max(0, first - 70)) + 1);
  const end = Math.min(hay.length, start + 200);
  // Keep only complete [from, to) pairs that fall inside the window.
  const pairs: number[] = [];
  for (let i = 0; i + 1 < ranges.length; i += 2) {
    const a = ranges[i] - start;
    const b = ranges[i + 1] - start;
    if (a >= 0 && b <= end - start) pairs.push(a, b);
  }
  let key = 0;
  const parts = uFuzzy.highlight<ReactNode[], ReactNode>(
    hay.slice(start, end),
    pairs,
    (part, matched) =>
      matched ? (
        <mark key={key++} className="rounded-sm bg-accent-soft px-0.5 text-fg">
          {part}
        </mark>
      ) : (
        part
      ),
    [],
    (acc, part) => (acc.push(part), acc),
  );
  return (
    <>
      {start > 0 && "…"}
      {parts}
      {end < hay.length && "…"}
    </>
  );
}

export function BlogIndex({ docs, featured }: { docs: SearchDoc[]; featured?: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const input = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(params.get("q") ?? "");
  const categoryParam = params.get("category") ?? "";
  const categories = useMemo(() => categoryParam.split(",").filter(Boolean), [categoryParam]);
  const tag = params.get("tag");
  const [limit, setLimit] = useState(PAGE);

  // Write the query to the URL (debounced) so every search is shareable.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (query) next.set("q", query);
      else next.delete("q");
      const qs = next.toString();
      if (qs !== params.toString()) router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    }, 250);
    return () => clearTimeout(t);
  }, [query, params, pathname, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        input.current?.focus();
        input.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const toggleCategory = (c: string) => {
    const set = new Set(categories);
    if (set.has(c)) set.delete(c);
    else set.add(c);
    setParam("category", [...set].join(",") || null);
  };

  const filtered = useMemo(
    () =>
      docs.filter(
        (d) => (!categories.length || categories.includes(d.category)) && (!tag || d.tags.includes(tag)),
      ),
    [docs, categories, tag],
  );

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    const hay = filtered.map(haystackOf);
    const [idxs, info, order] = uf.search(hay, q, 0, 1e3);
    if (info && order) {
      return order.map((o) => {
        const i = info.idx[o];
        return { doc: filtered[i], snippet: snippet(hay[i], info.ranges[o]) };
      });
    }
    return (idxs ?? []).map((i) => ({ doc: filtered[i], snippet: null }));
  }, [query, filtered]);

  const counts = useMemo(() => {
    const m = new Map<string, { name: string; count: number }>();
    for (const d of docs) m.set(d.category, { name: d.categoryName, count: (m.get(d.category)?.count ?? 0) + 1 });
    return [...m].sort(([, a], [, b]) => b.count - a.count || a.name.localeCompare(b.name));
  }, [docs]);

  const filtering = Boolean(query.trim() || categories.length || tag);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          ref={input}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE);
          }}
          placeholder={`Search ${docs.length} posts…`}
          aria-label="Search posts"
          className="h-11 w-full rounded-xl border border-line bg-elev pl-10 pr-12 text-[0.95rem] text-fg outline-none transition-colors placeholder:text-faint focus:border-line-strong [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-faint hover:bg-hover hover:text-fg"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2">/</kbd>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
        {counts.map(([c, { name, count }]) => {
          const on = categories.includes(c);
          return (
            <button
              key={c}
              type="button"
              aria-pressed={on}
              onClick={() => toggleCategory(c)}
              className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[0.8rem] transition-colors ${
                on ? "border-accent/50 bg-accent-soft text-fg" : "border-line text-muted hover:border-line-strong hover:text-fg"
              }`}
            >
              {name}
              <span className="font-mono text-[0.7rem] text-faint">{count}</span>
            </button>
          );
        })}
        {tag && (
          <button
            type="button"
            onClick={() => setParam("tag", null)}
            className="inline-flex h-7 items-center gap-1.5 rounded-full border border-accent/50 bg-accent-soft px-3 font-mono text-[0.78rem] text-fg"
          >
            #{tag} <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {!filtering && featured}

      <div className="mt-12">
        {results ? (
          <>
            <p className="label mb-4">
              {results.length} result{results.length === 1 ? "" : "s"} for “{query.trim()}”
            </p>
            {results.length ? (
              <ul>
                {results.slice(0, limit).map((r) => (
                  <PostRow key={r.doc.slug} post={r.doc} snippet={r.snippet} showYear />
                ))}
              </ul>
            ) : (
              <EmptyState onClear={() => setQuery("")} />
            )}
          </>
        ) : filtering ? (
          filtered.length ? (
            <ul>
              {filtered.slice(0, limit).map((d) => (
                <PostRow key={d.slug} post={d} showYear />
              ))}
            </ul>
          ) : (
            <EmptyState onClear={() => router.replace(pathname)} />
          )
        ) : (
          <PostArchive posts={filtered.slice(0, limit)} />
        )}

        {(results ?? filtered).length > limit && (
          <button
            type="button"
            onClick={() => setLimit((l) => l + PAGE)}
            className="mt-8 h-10 w-full rounded-xl border border-line text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
          >
            Show more <span className="font-mono text-xs text-faint">({(results ?? filtered).length - limit} left)</span>
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-line px-6 py-12 text-center">
      <p className="text-fg">Nothing matches that.</p>
      <p className="mt-1 text-sm text-faint">Try fewer words, or a broader topic.</p>
      <button type="button" onClick={onClear} className="link mt-4 text-sm">
        Clear filters
      </button>
    </div>
  );
}
