import { artCells } from "@/lib/art";

/** Monochrome with a single accent, so it never shouts. See lib/art.ts. */
export function PostArt({
  slug,
  className = "",
  cols = 24,
  rows = 10,
}: {
  slug: string;
  className?: string;
  cols?: number;
  rows?: number;
}) {
  const cells = artCells(slug, cols, rows);
  return (
    <svg viewBox={`0 0 ${cols} ${rows}`} className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      {cells.map((c) => (
        <circle
          key={`${c.x}-${c.y}`}
          cx={c.x + 0.5}
          cy={c.y + 0.5}
          r={c.r}
          className={c.accent ? "fill-accent" : c.r > 0.19 ? "fill-faint" : "fill-line-strong"}
          opacity={c.accent ? 0.95 : c.r > 0.19 ? 0.6 + (c.r - 0.19) * 1.6 : 0.8}
        />
      ))}
    </svg>
  );
}
