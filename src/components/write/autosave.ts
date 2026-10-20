/**
 * Autosave to GitHub, paced for its limits (secondary limit ≈ 80 writes/min,
 * 500/hour) and for the issue's public edit history: save after a pause in
 * typing, never more often than MIN_GAP, but at least every MAX_WAIT while
 * typing non-stop. Worst case ≈ 240 saves/hour; a normal session is far fewer.
 */
export const IDLE_MS = 4_000;
export const MIN_GAP_MS = 15_000;
export const MAX_WAIT_MS = 30_000;

/** When the next autosave may run, given when typing started, the last save and any backoff. */
export function nextSaveAt(now: number, firstChange: number, lastSave: number, backoffUntil: number): number {
  return Math.max(Math.min(now + IDLE_MS, firstChange + MAX_WAIT_MS), lastSave + MIN_GAP_MS, backoffUntil);
}
