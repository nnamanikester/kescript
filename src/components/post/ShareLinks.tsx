"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { LinkedInIcon, XIcon } from "@/components/ui/brand-icons";

export function ShareLinks({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const btn =
    "inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-[0.8rem] text-muted transition-colors hover:border-line-strong hover:text-fg";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className={btn}
        onClick={async () => {
          await navigator.clipboard?.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-ok" /> : <Link2 className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy link"}
      </button>
      <a
        className={btn}
        target="_blank"
        rel="noopener noreferrer"
        href={`https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
      >
        <XIcon className="h-3 w-3" /> Post
      </a>
      <a
        className={btn}
        target="_blank"
        rel="noopener noreferrer"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
      >
        <LinkedInIcon className="h-3 w-3" /> Share
      </a>
      <a
        className={btn}
        target="_blank"
        rel="noopener noreferrer"
        href={`https://news.ycombinator.com/submitlink?u=${encodeURIComponent(url)}&t=${encodeURIComponent(title)}`}
      >
        <span className="font-mono text-[0.7rem] font-bold">Y</span> Submit
      </a>
    </div>
  );
}
