"use client";

import { useState } from "react";
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { ChevronRight } from "lucide-react";
import { AttrInput } from "./AttrInput";

/**
 * A collapsible section. The body is ordinary editor content — images, lists,
 * code, "/" blocks, even another collapsible. The chevron only folds it here;
 * "starts open" decides what readers see.
 */
export function DetailsView({ node, updateAttributes, editor, getPos }: NodeViewProps) {
  const { summary, open } = node.attrs as { summary: string; open: boolean };
  const [folded, setFolded] = useState(false);

  return (
    <NodeViewWrapper className="writer-details" data-folded={folded || undefined}>
      <div contentEditable={false} className="writer-details-head">
        <button
          type="button"
          onClick={() => setFolded((f) => !f)}
          aria-expanded={!folded}
          aria-label={folded ? "Show contents" : "Hide contents"}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-faint hover:bg-hover hover:text-fg"
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${folded ? "" : "rotate-90"}`} aria-hidden />
        </button>
        <AttrInput
          value={summary}
          onCommit={(next) => updateAttributes({ summary: next })}
          onKeyDown={(e) => {
            // Enter drops you into the body, ready to write.
            if (e.key !== "Enter") return;
            e.preventDefault();
            setFolded(false);
            const pos = getPos();
            if (typeof pos === "number") editor.chain().focus(pos + 2).run();
          }}
          placeholder="Title readers click to open"
          aria-label="Collapsible title"
          className="min-w-0 flex-1 bg-transparent font-medium text-fg outline-none placeholder:text-faint"
        />
        <button
          type="button"
          onClick={() => updateAttributes({ open: !open })}
          aria-pressed={open}
          title="Whether readers see it open or closed at first"
          className={`shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-[0.68rem] transition-colors ${
            open ? "border-line-strong text-fg" : "border-line text-faint hover:text-fg"
          }`}
        >
          {open ? "starts open" : "starts closed"}
        </button>
      </div>
      <NodeViewContent className="writer-details-body" />
    </NodeViewWrapper>
  );
}
