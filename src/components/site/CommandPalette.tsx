"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import uFuzzy from "@leeoniya/ufuzzy";
import { ArrowRight, CornerDownLeft, FileText, Hash, Link2, Mail, Monitor, Moon, Rss, Search, Sun } from "lucide-react";
import { GitHubIcon } from "@/components/ui/brand-icons";
import { FOOTER_NAV, GH_REPO_URL, SITE } from "@/lib/site";
import type { SearchDoc } from "@/lib/content";
import { applyTheme } from "./theme";

export const OPEN_PALETTE = "open-command-palette";

interface Item {
  id: string;
  group: "Posts" | "Pages" | "Topics" | "Actions";
  title: string;
  hint?: string;
  icon: React.ReactNode;
  keywords?: string;
  run: () => void;
}

const uf = new uFuzzy({ intraMode: 1, intraIns: 1 });

/** Where focus goes back to on close. One palette per page, so module scope is fine. */
let returnFocusTo: HTMLElement | null = null;

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<SearchDoc[] | null>(null);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    returnFocusTo?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        returnFocusTo = document.activeElement as HTMLElement;
        setOpen((o) => !o);
      }
    };
    const onOpen = () => {
      returnFocusTo = document.activeElement as HTMLElement;
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE, onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => input.current?.focus());
    document.body.style.overflow = "hidden";
    if (!posts) {
      fetch("/api/posts")
        .then((r) => r.json())
        .then((d: SearchDoc[]) => setPosts(d))
        .catch(() => setPosts([]));
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, posts]);

  const go = useCallback(
    (href: string) => {
      close();
      if (href.startsWith("http") || href.startsWith("mailto:") || href.endsWith(".xml")) window.open(href, "_blank", "noopener");
      else router.push(href);
    },
    [close, router],
  );

  const items = useMemo<Item[]>(() => {
    const q = query.trim();
    const pages: Item[] = [{ href: "/", label: "Home" }, ...FOOTER_NAV].map((p) => ({
      id: `page:${p.href}`,
      group: "Pages",
      title: p.label,
      hint: p.href,
      icon: <ArrowRight className="h-4 w-4" />,
      run: () => go(p.href),
    }));
    const actions: Item[] = [
      { id: "theme:light", group: "Actions", title: "Switch to light theme", icon: <Sun className="h-4 w-4" />, keywords: "theme appearance", run: () => (applyTheme("light"), close()) },
      { id: "theme:dark", group: "Actions", title: "Switch to dark theme", icon: <Moon className="h-4 w-4" />, keywords: "theme appearance", run: () => (applyTheme("dark"), close()) },
      { id: "theme:system", group: "Actions", title: "Use system theme", icon: <Monitor className="h-4 w-4" />, keywords: "theme appearance auto", run: () => (applyTheme("system"), close()) },
      {
        id: "copy",
        group: "Actions",
        title: "Copy link to this page",
        icon: <Link2 className="h-4 w-4" />,
        keywords: "url share",
        run: () => {
          navigator.clipboard?.writeText(window.location.href);
          close();
        },
      },
      { id: "rss", group: "Actions", title: "RSS feed", hint: "/rss.xml", icon: <Rss className="h-4 w-4" />, keywords: "subscribe feed", run: () => go("/rss.xml") },
      { id: "source", group: "Actions", title: "View source on GitHub", icon: <GitHubIcon className="h-4 w-4" />, keywords: "code repo", run: () => go(GH_REPO_URL) },
      { id: "email", group: "Actions", title: "Send me an email", hint: SITE.email, icon: <Mail className="h-4 w-4" />, keywords: "contact", run: () => go(`mailto:${SITE.email}`) },
    ];

    const tagSet = new Set((posts ?? []).flatMap((p) => p.tags));
    const topics: Item[] = [...tagSet].map((t) => ({
      id: `tag:${t}`,
      group: "Topics",
      title: `#${t}`,
      icon: <Hash className="h-4 w-4" />,
      run: () => go(`/tags/${t}`),
    }));

    const postItems = (docs: SearchDoc[]): Item[] =>
      docs.map((p) => ({
        id: `post:${p.slug}`,
        group: "Posts",
        title: p.title,
        hint: p.date.slice(0, 4),
        icon: <FileText className="h-4 w-4" />,
        run: () => go(`/blog/${p.slug}`),
      }));

    if (!q) return [...postItems((posts ?? []).slice(0, 5)), ...pages, ...actions.slice(0, 4)];

    const lower = q.toLowerCase();
    const match = (i: Item) => `${i.title} ${i.hint ?? ""} ${i.keywords ?? ""}`.toLowerCase().includes(lower);

    let ranked: SearchDoc[] = [];
    if (posts?.length) {
      const hay = posts.map((p) => `${p.title} ${p.tags.join(" ")} ${p.description} ${p.text}`);
      const [, info, order] = uf.search(hay, q, 0, 1e3);
      if (info && order) ranked = order.map((i) => posts[info.idx[i]]);
      else {
        const [idxs] = uf.search(hay, q);
        ranked = (idxs ?? []).map((i) => posts[i]);
      }
    }
    return [...postItems(ranked.slice(0, 8)), ...topics.filter(match).slice(0, 4), ...pages.filter(match), ...actions.filter(match)];
  }, [query, posts, go, close]);

  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown" || (e.ctrlKey && e.key === "n")) {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp" || (e.ctrlKey && e.key === "p")) {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[active]?.run();
    }
  };

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="absolute inset-0 bg-bg/70 backdrop-blur-sm" onClick={close} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line-strong bg-elev shadow-card animate-fade-up" onKeyDown={onKeyDown}>
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-4 w-4 shrink-0 text-faint" />
          <input
            ref={input}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search posts, topics, pages…"
            aria-label="Search"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={items[active] ? `palette-${items[active].id}` : undefined}
            className="h-13 w-full bg-transparent text-[0.95rem] text-fg outline-none placeholder:text-faint"
          />
          <kbd>esc</kbd>
        </div>
        <div ref={list} id="palette-list" role="listbox" className="max-h-[min(60vh,28rem)] overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-faint">
              No results for <span className="text-fg">“{query}”</span>
            </p>
          ) : (
            items.map((item, i) => {
              const header = item.group !== lastGroup ? item.group : null;
              lastGroup = item.group;
              return (
                <div key={item.id}>
                  {header && <p className="label px-3 pb-1.5 pt-3 first:pt-1">{header}</p>}
                  <button
                    type="button"
                    id={`palette-${item.id}`}
                    role="option"
                    aria-selected={i === active}
                    data-index={i}
                    onMouseMove={() => setActive(i)}
                    onClick={item.run}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      i === active ? "bg-hover text-fg" : "text-muted"
                    }`}
                  >
                    <span className={i === active ? "text-accent" : "text-faint"}>{item.icon}</span>
                    <span className="min-w-0 flex-1 truncate">{item.title}</span>
                    {item.hint && <span className="shrink-0 font-mono text-xs text-faint">{item.hint}</span>}
                    {i === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-faint" />}
                  </button>
                </div>
              );
            })
          )}
        </div>
        <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 font-mono text-[0.7rem] text-faint">
          <span className="flex items-center gap-1.5">
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd>↵</kbd> open
          </span>
          <span className="ml-auto">{posts ? `${posts.length} posts indexed` : "indexing…"}</span>
        </div>
      </div>
    </div>
  );
}
