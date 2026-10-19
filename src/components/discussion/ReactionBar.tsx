"use client";

import { useEffect, useRef, useState } from "react";
import { SmilePlus } from "lucide-react";
import { REACTIONS, type ReactionCounts, type ReactionKey } from "@/lib/reactions";

interface Props {
  reactions: ReactionCounts;
  onToggle: (key: ReactionKey) => void;
  /** "full": every reaction is visible (the post). "compact": GitHub-style pills + picker (comments). */
  variant?: "full" | "compact";
  disabled?: boolean;
}

function Pill({
  emoji,
  label,
  count,
  active,
  onClick,
  disabled,
}: {
  emoji: string;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const [pop, setPop] = useState(false);
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      aria-label={`${label}${count ? `, ${count}` : ""}${active ? " (you reacted)" : ""}`}
      title={label}
      onClick={() => {
        if (!active) {
          setPop(true);
          setTimeout(() => setPop(false), 350);
        }
        onClick();
      }}
      className={`group inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-sm transition-all disabled:opacity-60 ${
        active
          ? "border-accent/50 bg-accent-soft text-fg"
          : "border-line bg-elev text-muted hover:border-line-strong hover:bg-hover"
      }`}
    >
      <span className={`leading-none transition-transform ${pop ? "scale-125" : "group-hover:scale-110"}`}>{emoji}</span>
      {count > 0 && <span className="font-mono text-xs tabular-nums">{count}</span>}
    </button>
  );
}

export function ReactionBar({ reactions, onToggle, variant = "compact", disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (variant === "full") {
    return (
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map((r) => (
          <Pill
            key={r.key}
            emoji={r.emoji}
            label={r.label}
            count={reactions[r.key]?.count ?? 0}
            active={reactions[r.key]?.viewerHasReacted ?? false}
            onClick={() => onToggle(r.key)}
            disabled={disabled}
          />
        ))}
      </div>
    );
  }

  const present = REACTIONS.filter((r) => (reactions[r.key]?.count ?? 0) > 0);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {present.map((r) => (
        <Pill
          key={r.key}
          emoji={r.emoji}
          label={r.label}
          count={reactions[r.key]!.count}
          active={reactions[r.key]!.viewerHasReacted}
          onClick={() => onToggle(r.key)}
          disabled={disabled}
        />
      ))}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Add reaction"
          aria-expanded={open}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-faint transition-colors hover:border-line hover:bg-hover hover:text-fg"
        >
          <SmilePlus className="h-4 w-4" />
        </button>
        {open && (
          <div className="absolute bottom-full left-0 z-20 mb-2 flex gap-0.5 rounded-xl border border-line bg-elev p-1 shadow-card animate-fade-up">
            {REACTIONS.map((r) => (
              <button
                key={r.key}
                type="button"
                title={r.label}
                aria-label={r.label}
                onClick={() => {
                  onToggle(r.key);
                  setOpen(false);
                }}
                className={`grid h-8 w-8 place-items-center rounded-lg text-base transition-transform hover:scale-125 hover:bg-hover ${
                  reactions[r.key]?.viewerHasReacted ? "bg-accent-soft" : ""
                }`}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
