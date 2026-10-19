"use client";

import { Children, useId, useState, useSyncExternalStore, type ReactNode } from "react";

/**
 * Tabbed code blocks. The choice is a reader preference, not per-block state:
 * pick "pnpm" (or "Python") once and every group on every page follows.
 */
const STORAGE_KEY = "code-group-preference";
const EVENT = "code-group-preference";

function readPreference(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Most-recent-first list of chosen labels, so the best available match wins. */
function choose(label: string) {
  const next = [label, ...readPreference().filter((l) => l !== label)].slice(0, 12);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function CodeGroup({ "data-labels": rawLabels, children }: { "data-labels"?: string; children?: ReactNode }) {
  const id = useId();
  const labels = JSON.parse(rawLabels ?? "[]") as string[];
  const panels = Children.toArray(children).filter((c) => typeof c === "object");
  const prefs = useSyncExternalStore(subscribe, () => localStorage.getItem(STORAGE_KEY) ?? "[]", () => "[]");
  // A click in this group wins; otherwise follow the reader's most recent preference.
  const [picked, setPicked] = useState<number | null>(null);
  const preferred = (JSON.parse(prefs) as string[]).map((p) => labels.indexOf(p)).find((i) => i >= 0);
  const active = preferred ?? picked ?? 0;

  const select = (i: number) => {
    setPicked(i);
    choose(labels[i]);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (active + (e.key === "ArrowRight" ? 1 : -1) + labels.length) % labels.length;
    select(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };

  return (
    <div className="code-group not-prose overflow-hidden rounded-xl border border-line bg-[var(--code-bg)]">
      <div role="tablist" aria-label="Code variants" onKeyDown={onKeyDown} className="flex overflow-x-auto border-b border-line px-1.5">
        {labels.map((label, i) => (
          <button
            key={label + i}
            id={`${id}-tab-${i}`}
            role="tab"
            type="button"
            aria-selected={i === active}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => select(i)}
            className={`relative h-10 shrink-0 px-3 font-mono text-[0.75rem] transition-colors ${
              i === active ? "text-fg" : "text-faint hover:text-muted"
            }`}
          >
            {label}
            {i === active && <span className="absolute inset-x-2 -bottom-px h-px bg-accent" aria-hidden />}
          </button>
        ))}
      </div>
      {panels.map((panel, i) => (
        <div key={i} id={`${id}-panel-${i}`} role="tabpanel" aria-labelledby={`${id}-tab-${i}`} hidden={i !== active}>
          {panel}
        </div>
      ))}
    </div>
  );
}
