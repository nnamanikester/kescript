"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function BioCopy({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* clipboard blocked */
        }
      }}
      className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-line px-2 font-mono text-[0.7rem] text-faint transition-colors hover:border-line-strong hover:text-fg"
    >
      {copied ? <Check className="h-3 w-3 text-ok" /> : <Copy className="h-3 w-3" />}
      {copied ? "copied" : "copy"}
    </button>
  );
}
