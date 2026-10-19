"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, ChevronUp, Link2 } from "lucide-react";
import type { TocHeading } from "@/lib/markdown/plugins";
import { toast } from "@/components/site/Enhancers";

const R = 9;
const C = 2 * Math.PI * R;

/**
 * A quiet pill at the bottom of the screen while reading: progress ring,
 * current section, and the outline one tap away. Hidden at the top of the
 * post and once the article ends, so it never sits on the discussion.
 */
export function ReadingHud({ headings, title }: { headings: TocHeading[]; title: string }) {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const ring = useRef<SVGCircleElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const article = document.getElementById("article-body");
    if (!article) return;
    const els = headings.map((h) => document.getElementById(h.id)).filter((e): e is HTMLElement => !!e);
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = article.getBoundingClientRect();
      const total = rect.height - innerHeight * 0.5;
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(total, 1)));
      ring.current?.setAttribute("stroke-dashoffset", String(C * (1 - progress)));
      setVisible(rect.top < -120 && rect.bottom > innerHeight * 0.6);
      let current: string | null = null;
      for (const el of els) {
        if (el.getBoundingClientRect().top <= innerHeight * 0.3) current = el.id;
        else break;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
    };
  }, [headings]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !panel.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const section = headings.find((h) => h.id === active)?.text ?? title;
  const hasToc = headings.length > 0;

  return (
    <div
      ref={panel}
      className={`fixed inset-x-0 bottom-5 z-[80] flex justify-center px-4 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
        visible || open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <div className="relative w-full max-w-sm">
        {open && hasToc && (
          <nav
            aria-label="On this page"
            className="toast-in absolute inset-x-0 bottom-full mb-2 max-h-[55vh] overflow-y-auto rounded-2xl border border-line-strong bg-elev/95 p-2 shadow-card backdrop-blur-xl"
          >
            <p className="label px-3 pb-1 pt-2">On this page</p>
            <ol>
              {headings.map((h) => (
                <li key={h.id}>
                  <a
                    href={`#${h.id}`}
                    onClick={() => setOpen(false)}
                    className={`block rounded-lg py-2 pr-3 text-sm transition-colors hover:bg-hover ${h.depth === 3 ? "pl-7" : "pl-3"} ${
                      h.id === active ? "text-fg" : "text-muted"
                    }`}
                  >
                    {h.id === active && <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" />}
                    {h.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="flex items-center gap-1 rounded-full border border-line-strong bg-elev/90 p-1 shadow-card backdrop-blur-xl">
          <button
            type="button"
            onClick={() => hasToc && setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={hasToc ? "Show outline" : "Reading progress"}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-full py-1 pl-1.5 pr-3 text-left transition-colors hover:bg-hover"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 -rotate-90" aria-hidden>
              <circle cx="12" cy="12" r={R} fill="none" strokeWidth="2.5" className="stroke-line-strong" />
              <circle
                ref={ring}
                cx="12"
                cy="12"
                r={R}
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C}
                className="stroke-accent"
              />
            </svg>
            <span className="truncate text-[0.82rem] text-muted">{section}</span>
            {hasToc && <ChevronUp className={`ml-auto h-3.5 w-3.5 shrink-0 text-faint transition-transform ${open ? "" : "rotate-180"}`} />}
          </button>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard?.writeText(location.href.split("#")[0]);
              toast("Link copied");
            }}
            aria-label="Copy link to this post"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-faint transition-colors hover:bg-hover hover:text-fg"
          >
            <Link2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-faint transition-colors hover:bg-hover hover:text-fg"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
