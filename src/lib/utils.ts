export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Same algorithm swyxkit uses, so slugs survive a migration. */
export function slugify(text: string | number): string {
  return text
    .toString()
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2025-03-05" -> "Mar 5, 2025". Pure string maths: identical on server and client. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** "2025-03-05" -> "2025-03-05" (the engineer's date). */
export function isoDay(iso: string): string {
  return iso.slice(0, 10);
}

export function relativeTime(iso: string, now = Date.now()): string {
  const s = Math.round((now - new Date(iso).getTime()) / 1000);
  if (s < 45) return "just now";
  const units: [number, string][] = [
    [60, "minute"],
    [3600, "hour"],
    [86400, "day"],
    [604800, "week"],
    [2629800, "month"],
    [31557600, "year"],
  ];
  let unit = "minute";
  let value = 1;
  for (let i = units.length - 1; i >= 0; i--) {
    if (s >= units[i][0]) {
      unit = units[i][1];
      value = Math.floor(s / units[i][0]);
      break;
    }
  }
  return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
}

export function readingTime(text: string): { minutes: number; words: number } {
  const words = text
    .replace(/```[\s\S]*?```/g, (block) => block.split(/\s+/).slice(0, 40).join(" "))
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return { minutes: Math.max(1, Math.round(words / 230)), words };
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
