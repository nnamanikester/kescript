"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

/** swyxkit's trick: turn the broken URL into a search. */
export function NotFoundSearch() {
  const pathname = usePathname() ?? "";
  const guess = decodeURIComponent(pathname.split("/").filter(Boolean).pop() ?? "")
    .replace(/[-_]+/g, " ")
    .trim();
  if (!guess) return null;
  return (
    <Link
      href={`/blog?q=${encodeURIComponent(guess)}`}
      className="mt-8 inline-flex items-center gap-2.5 rounded-xl border border-line bg-elev px-4 py-3 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
    >
      <Search className="h-4 w-4 text-faint" />
      Search the writing for <span className="font-medium text-fg">“{guess}”</span>
    </Link>
  );
}
