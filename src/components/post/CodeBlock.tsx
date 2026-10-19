"use client";

import { useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Copy, WrapText } from "lucide-react";
import { languageInfo } from "@/lib/languages";

const COLLAPSE_AFTER = 28;

export function CopyButton({ getText, className = "" }: { getText: () => string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(getText());
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* clipboard blocked — nothing useful to do */
        }
      }}
      aria-label={copied ? "Copied" : "Copy code"}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-hover hover:text-fg ${className}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

interface CodeBlockProps {
  "data-title"?: string;
  "data-language"?: string;
  "data-lines"?: string;
  /** Inside a code group the tab strip replaces the header. */
  "data-grouped"?: string;
  children?: ReactNode;
}

export function CodeBlock(props: CodeBlockProps) {
  const ref = useRef<HTMLElement>(null);
  const title = props["data-title"];
  const lang = props["data-language"];
  const lines = Number(props["data-lines"] ?? 0);
  const collapsible = lines > COLLAPSE_AFTER;
  const [collapsed, setCollapsed] = useState(collapsible);
  const [wrap, setWrap] = useState(false);
  const info = languageInfo(lang);

  const getText = () => {
    const code = ref.current?.querySelector("code");
    if (!code) return "";
    // Lines removed in a diff shouldn't end up in someone's terminal.
    return [...code.querySelectorAll<HTMLElement>("[data-line]")]
      .filter((l) => !l.classList.contains("remove"))
      .map((l) => l.textContent ?? "")
      .join("\n");
  };

  return (
    <figure
      ref={ref}
      className="code-block not-prose group/code"
      data-collapsed={collapsed}
    >
      {props["data-grouped"] !== undefined ? (
        <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover/code:opacity-100 focus-within:opacity-100">
          <CopyButton getText={getText} className="bg-elev" />
        </div>
      ) : (
        <figcaption className="flex h-10 items-center gap-3 border-b border-line px-3.5 font-mono text-[0.75rem] text-faint">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: info.color }} aria-hidden />
            <span>{info.name}</span>
          </span>
          {title && (
            <>
              <span className="text-line-strong" aria-hidden>
                /
              </span>
              <span className="truncate text-muted">{title}</span>
            </>
          )}
          <span className="ml-auto flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setWrap((w) => !w)}
              aria-pressed={wrap}
              aria-label="Toggle line wrapping"
              className={`hidden h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-hover hover:text-fg sm:inline-flex ${wrap ? "text-accent" : ""}`}
            >
              <WrapText className="h-3.5 w-3.5" />
            </button>
            <CopyButton getText={getText} />
          </span>
        </figcaption>
      )}
      <div className={wrap ? "[&_code]:!min-w-0 [&_pre]:whitespace-pre-wrap [&_pre]:break-words" : undefined}>
        {props.children}
      </div>
      {collapsible && (
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="relative z-10 flex w-full items-center justify-center gap-1.5 border-t border-line py-2 font-mono text-[0.72rem] text-faint transition-colors hover:bg-hover hover:text-fg"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${collapsed ? "" : "rotate-180"}`} />
          {collapsed ? `Show all ${lines} lines` : "Collapse"}
        </button>
      )}
    </figure>
  );
}
