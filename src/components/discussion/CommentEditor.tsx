"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { GitHubIcon } from "@/components/ui/brand-icons";
import type { Viewer } from "@/lib/reactions";

interface Props {
  viewer: Viewer | null;
  /** Persist drafts under this key so a sign-in redirect or a reload loses nothing. */
  draftKey?: string;
  initial?: string;
  submitLabel?: string;
  autoFocus?: boolean;
  onSubmit: (body: string) => Promise<boolean>;
  onCancel?: () => void;
}

export function CommentEditor({ viewer, draftKey, initial = "", submitLabel = "Comment", autoFocus, onSubmit, onCancel }: Props) {
  // Only ever mounted on the client (see Discussion), so storage is safe to read here.
  const [body, setBody] = useState(() => {
    if (!draftKey) return initial;
    try {
      return localStorage.getItem(draftKey) ?? initial;
    } catch {
      return initial;
    }
  });
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [preview, setPreview] = useState<{ source: string; html: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!draftKey) return;
    try {
      if (body) localStorage.setItem(draftKey, body);
      else localStorage.removeItem(draftKey);
    } catch {
      /* ignore */
    }
  }, [body, draftKey]);

  // Grow with the content.
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 112), 480)}px`;
  }, [body, tab]);

  useEffect(() => {
    if (tab !== "preview" || !body.trim()) return;
    let cancelled = false;
    fetch("/api/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) })
      .then((r) => r.json())
      .then((d: { html?: string }) => !cancelled && setPreview({ source: body, html: d.html ?? "" }))
      .catch(() => !cancelled && setPreview({ source: body, html: "<p>Preview unavailable.</p>" }));
    return () => {
      cancelled = true;
    };
  }, [tab, body]);

  const submit = async () => {
    if (!body.trim() || busy) return;
    setBusy(true);
    const ok = await onSubmit(body);
    setBusy(false);
    if (ok) {
      setBody("");
      setTab("write");
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-elev transition-colors focus-within:border-line-strong">
      <div className="flex items-center gap-1 border-b border-line px-2">
        {(["write", "preview"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`relative h-9 px-2.5 text-[0.8125rem] capitalize transition-colors ${tab === t ? "text-fg" : "text-faint hover:text-muted"}`}
          >
            {t}
            {tab === t && <span className="absolute inset-x-2 -bottom-px h-px bg-accent" />}
          </button>
        ))}
        <span className="ml-auto hidden font-mono text-[0.7rem] text-faint sm:block">Markdown supported</span>
      </div>

      {tab === "write" ? (
        <textarea
          ref={area}
          value={body}
          autoFocus={autoFocus}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={viewer ? "Add to the discussion…" : "Write your comment — you'll sign in with GitHub when you post."}
          aria-label="Comment"
          className="block w-full resize-none bg-transparent px-4 py-3 text-[0.95rem] leading-relaxed text-fg outline-none placeholder:text-faint"
        />
      ) : (
        <div className="min-h-28 px-4 py-3">
          {!body.trim() ? (
            <p className="text-sm text-faint">Nothing to preview.</p>
          ) : preview?.source !== body ? (
            <div className="space-y-2">
              <div className="h-3 w-2/3 animate-pulse rounded bg-subtle" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-subtle" />
            </div>
          ) : (
            <div className="comment-body" dangerouslySetInnerHTML={{ __html: preview.html }} />
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-line bg-subtle/50 px-3 py-2">
        <span className="hidden items-center gap-1.5 font-mono text-[0.7rem] text-faint sm:flex">
          <kbd>⌘</kbd>
          <kbd>↵</kbd>
          <span>to submit</span>
        </span>
        <div className="ml-auto flex items-center gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="h-8 rounded-lg px-3 text-sm text-muted transition-colors hover:bg-hover hover:text-fg">
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!body.trim() || busy}
            className="inline-flex h-8 items-center gap-2 rounded-lg bg-fg px-3.5 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : !viewer && <GitHubIcon className="h-3.5 w-3.5" />}
            {viewer ? submitLabel : `Sign in & ${submitLabel.toLowerCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}
