/**
 * Generative cover art: every post gets a unique, deterministic dot-matrix
 * derived from its slug. Same slug, same art — on cards, the post header and
 * social images. Pure functions, no JSX, so the OG image route can use them too.
 */

/** FNV-1a: tiny, stable, good enough to seed a pattern. */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — deterministic PRNG from the slug hash. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Cell = { x: number; y: number; r: number; accent: boolean };

export function artCells(slug: string, cols = 24, rows = 10): Cell[] {
  const rand = rng(hash(slug));
  // Each post picks a "shape" for its wave: frequency, phase, and thickness.
  const freq = 0.18 + rand() * 0.35;
  const phase = rand() * Math.PI * 2;
  const amp = 0.25 + rand() * 0.3;
  const thickness = 0.16 + rand() * 0.14;
  const accentCol = Math.floor(rand() * cols);

  const cells: Cell[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ny = y / (rows - 1);
      const wave = 0.5 + Math.sin(x * freq + phase) * amp;
      const d = Math.abs(ny - wave);
      // Dots swell near the curve and fade away from it.
      const strength = Math.max(0, 1 - d / thickness);
      const jitter = rand() * 0.25;
      const r = 0.13 + Math.min(1, strength + jitter * strength) * 0.26;
      const accent = strength > 0.55 && Math.abs(x - accentCol) <= 1;
      cells.push({ x, y, r, accent });
    }
  }
  return cells;
}
