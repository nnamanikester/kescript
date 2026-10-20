"use client";

import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Plus } from "lucide-react";

/** Tabs on the site; stacked here so every variant stays editable. Each block's filename is its tab label. */
export function CodeGroupView({ node, editor, getPos }: NodeViewProps) {
  const addTab = () => {
    const pos = getPos();
    if (typeof pos !== "number") return;
    editor
      .chain()
      .insertContentAt(pos + node.nodeSize - 1, { type: "codeBlock", attrs: { language: null, meta: `title="Tab ${node.childCount + 1}"` } })
      .focus()
      .run();
  };

  return (
    <NodeViewWrapper className="code-group writer-code-group not-prose overflow-hidden rounded-xl border border-line bg-[var(--code-bg)]">
      <div contentEditable={false} className="flex h-9 items-center justify-between border-b border-line px-3.5 font-mono text-[0.7rem] text-faint">
        <span>
          <span className="text-accent">tabs</span> · {node.childCount} variant{node.childCount === 1 ? "" : "s"} · the filename is the tab label
        </span>
        <button type="button" onClick={addTab} className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-hover hover:text-fg">
          <Plus className="h-3 w-3" /> tab
        </button>
      </div>
      <NodeViewContent className="writer-code-group-body" />
    </NodeViewWrapper>
  );
}
