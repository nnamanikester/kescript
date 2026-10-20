"use client";

import { useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Pencil, Play } from "lucide-react";
import { embedKind, youtubeId } from "@/lib/editor/markdown";
import { XIcon } from "@/components/ui/brand-icons";

export function EmbedView({ node, updateAttributes, selected }: NodeViewProps) {
  const url: string = node.attrs.url;
  const [editing, setEditing] = useState(!url);
  const [draft, setDraft] = useState(url);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const next = draft.trim();
    const kind = embedKind(next);
    if (!kind) return setError("Paste a YouTube link or a post on X");
    updateAttributes({ url: next, kind });
    setEditing(false);
    setError(null);
  };

  const ring = selected ? "ring-2 ring-accent/50" : "";

  if (editing || !url) {
    return (
      <NodeViewWrapper className="embed not-prose">
        <div contentEditable={false} className={`rounded-xl border border-dashed border-line-strong bg-subtle/60 p-5 ${ring}`}>
          <label className="font-mono text-[0.7rem] text-faint" htmlFor={`embed-${url}`}>
            Embed a YouTube video or a post on X
          </label>
          <input
            id={`embed-${url}`}
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
              if (e.key === "Escape" && url) setEditing(false);
            }}
            placeholder="https://youtu.be/… or https://x.com/…/status/…"
            className="mt-2 w-full rounded-lg border border-line bg-elev px-3 py-2 font-mono text-xs text-fg outline-none focus:border-line-strong"
          />
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        </div>
      </NodeViewWrapper>
    );
  }

  const id = youtubeId(url);
  return (
    <NodeViewWrapper className="embed not-prose">
      <div contentEditable={false} data-drag-handle="" className={`group/embed relative overflow-hidden rounded-xl border border-line bg-elev ${ring}`}>
        {node.attrs.kind === "youtube" && id ? (
          <div className="relative aspect-video bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-80" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-black/70 text-white">
                <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
              </span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-5">
            <XIcon className="h-5 w-5 text-fg" />
            <div className="min-w-0">
              <p className="text-sm text-fg">Post on X</p>
              <p className="truncate font-mono text-xs text-faint">{url}</p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-line px-3.5 py-2 font-mono text-[0.7rem] text-faint">
          <span className="truncate">{url}</span>
          <button type="button" onClick={() => setEditing(true)} className="flex shrink-0 items-center gap-1 hover:text-fg">
            <Pencil className="h-3 w-3" /> change
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
