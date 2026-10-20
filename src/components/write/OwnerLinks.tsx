"use client";

import Link from "next/link";
import { PenLine } from "lucide-react";
import { useIsOwner } from "./useIsOwner";

/** Header shortcut to a new post. Renders nothing for readers. */
export function WriteButton() {
  const owner = useIsOwner();
  if (!owner) return null;
  return (
    <Link
      href="/write"
      aria-label="Write a post"
      title="Write a post"
      className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-hover hover:text-fg"
    >
      <PenLine className="h-4 w-4" />
    </Link>
  );
}

/** "Edit" on a post page, for the author only. */
export function EditPostLink({ issueNumber }: { issueNumber: number }) {
  const owner = useIsOwner();
  if (!owner) return null;
  return (
    <Link
      href={`/write/${issueNumber}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 font-mono text-xs text-muted transition-colors hover:border-line-strong hover:text-fg"
    >
      <PenLine className="h-3 w-3" /> edit
    </Link>
  );
}
