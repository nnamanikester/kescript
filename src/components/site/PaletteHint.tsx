"use client";

import { OPEN_PALETTE } from "./CommandPalette";

/** "Press ⌘K" — teaches the shortcut by being clickable. Hidden on touch screens. */
export function PaletteHint() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE))}
      className="hidden items-center gap-1.5 px-2 font-mono text-xs text-faint transition-colors hover:text-fg sm:pointer-fine:inline-flex"
    >
      or press <kbd>⌘K</kbd>
    </button>
  );
}
