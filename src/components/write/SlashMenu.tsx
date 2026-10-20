"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { slashStore } from "./slash";

const WIDTH = 300;
const MAX_HEIGHT = 340;

export function SlashMenu() {
  const { open, items, index, rect } = useSyncExternalStore(slashStore.subscribe, slashStore.get, slashStore.get);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest" });
  }, [index]);

  if (!open || !rect) return null;

  const below = rect.bottom + 8 + MAX_HEIGHT < window.innerHeight;
  const style = {
    left: Math.max(12, Math.min(rect.left, window.innerWidth - WIDTH - 12)),
    width: WIDTH,
    ...(below ? { top: rect.bottom + 8 } : { bottom: window.innerHeight - rect.top + 8 }),
  };

  return createPortal(
    <div
      ref={listRef}
      role="listbox"
      aria-label="Insert a block"
      style={{ ...style, maxHeight: MAX_HEIGHT }}
      className="fixed z-[90] overflow-y-auto overscroll-contain rounded-xl border border-line bg-elev/95 p-1.5 shadow-card backdrop-blur-xl animate-fade-up"
      onMouseDown={(e) => e.preventDefault()}
    >
      {items.length === 0 && <p className="px-3 py-2.5 text-sm text-faint">No matching block</p>}
      {items.map((item, i) => {
        const header = item.group !== items[i - 1]?.group ? item.group : null;
        const Icon = item.icon;
        return (
          <div key={item.title}>
            {header && <p className="px-2.5 pb-1 pt-2 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-faint first:pt-1">{header}</p>}
            <button
              type="button"
              role="option"
              aria-selected={i === index}
              data-index={i}
              onMouseEnter={() => slashStore.hover(i)}
              onClick={() => slashStore.select(i)}
              className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                i === index ? "bg-hover text-fg" : "text-muted"
              }`}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line bg-bg">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm text-fg">{item.title}</span>
                <span className="block truncate text-xs text-faint">{item.hint}</span>
              </span>
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
