/**
 * An image's display width rides along in its URL fragment — `![](a.png#w=60)`
 * is 60% of the column — so it survives plain markdown and the browser never
 * sends it to the server.
 */
const WIDTH = /#w=(\d{1,3})$/;

export const MIN_IMAGE_WIDTH = 15;

export function clampWidth(width: number): number | null {
  const w = Math.round(Math.min(100, Math.max(MIN_IMAGE_WIDTH, width)));
  return w >= 100 ? null : w;
}

export function splitImageWidth(src: string): { src: string; width: number | null } {
  const match = src.match(WIDTH);
  if (!match) return { src, width: null };
  return { src: src.slice(0, match.index), width: clampWidth(Number(match[1])) };
}

export function withImageWidth(src: string, width: number | null | undefined): string {
  const w = width ? clampWidth(width) : null;
  return w ? `${src}#w=${w}` : src;
}
