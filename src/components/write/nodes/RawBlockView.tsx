"use client";

import { useRef } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useAutosize } from "../useAutosize";

/** Anything without a dedicated block — HTML, footnote text, reference links — kept as written. */
export function RawBlockView({ node, updateAttributes, selected, deleteNode }: NodeViewProps) {
  const source: string = node.attrs.source;
  const ref = useRef<HTMLTextAreaElement>(null);
  useAutosize(ref, source);
  const kind = /^\[\^[^\]]+\]:/.test(source) ? "footnote" : /^\s*</.test(source) ? "html" : "markdown";

  return (
    <NodeViewWrapper className={`writer-raw ${selected ? "is-selected" : ""}`}>
      <div contentEditable={false} className="rounded-lg border border-dashed border-line-strong bg-[var(--code-bg)]">
        <div className="flex items-center justify-between px-3 pt-2 font-mono text-[0.65rem] uppercase tracking-[0.08em] text-faint">
          <span>{kind}</span>
          {!source.trim() && (
            <button type="button" onClick={deleteNode} className="normal-case tracking-normal hover:text-fg">
              remove
            </button>
          )}
        </div>
        <textarea
          ref={ref}
          value={source}
          onChange={(e) => updateAttributes({ source: e.target.value })}
          spellCheck={kind === "footnote"}
          rows={1}
          className="block w-full resize-none bg-transparent px-3 pb-2.5 pt-1 font-mono text-[0.8rem] leading-relaxed text-fg outline-none"
        />
      </div>
    </NodeViewWrapper>
  );
}
