"use client";

import { useEffect, useState } from "react";
import type { TocHeading } from "@/lib/markdown/plugins";

/** Scroll-spy outline. The active section is the last heading above the top third of the viewport. */
export function TableOfContents({ headings }: { headings: TocHeading[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const onScroll = () => {
      const line = window.innerHeight * 0.3;
      let current: string | null = null;
      for (const el of els) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
        else break;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);

  return (
    <nav aria-label="On this page">
      <p className="label mb-3">On this page</p>
      <ol className="space-y-1 border-l border-line text-[0.8125rem]">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`-ml-px block border-l py-1 leading-snug transition-colors ${
                h.depth === 3 ? "pl-6" : "pl-3.5"
              } ${
                active === h.id
                  ? "border-accent text-fg"
                  : "border-transparent text-faint hover:border-line-strong hover:text-muted"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
