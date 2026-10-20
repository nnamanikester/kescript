"use client";

import { useMemo, useRef } from "react";
import katex from "katex";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useAutosize } from "../useAutosize";

export function renderMath(latex: string, displayMode: boolean): string {
  return katex.renderToString(latex, { displayMode, throwOnError: false, strict: false });
}

/** Rendered when you're reading, the LaTeX underneath when it's selected. */
export function MathBlockView({ node, updateAttributes, selected, editor, getPos }: NodeViewProps) {
  const latex: string = node.attrs.latex;
  const ref = useRef<HTMLTextAreaElement>(null);
  const html = useMemo(() => (latex.trim() ? renderMath(latex, true) : ""), [latex]);
  useAutosize(ref, latex);
  const editing = selected || !latex.trim();

  const leave = () => {
    const pos = getPos();
    if (typeof pos === "number") editor.chain().focus().setTextSelection(pos + node.nodeSize).run();
  };

  return (
    <NodeViewWrapper className={`writer-math ${selected ? "is-selected" : ""}`}>
      <div contentEditable={false}>
        {html ? (
          <div className="overflow-x-auto py-1 text-fg" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p className="py-2 text-center font-mono text-xs text-faint">Equation — write LaTeX below</p>
        )}
        {editing && (
          <textarea
            ref={ref}
            autoFocus={!latex}
            value={latex}
            onChange={(e) => updateAttributes({ latex: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
                e.preventDefault();
                leave();
              }
            }}
            placeholder="\int_0^1 x^2\,dx = \tfrac13"
            spellCheck={false}
            rows={1}
            className="mt-2 w-full resize-none rounded-lg border border-line bg-[var(--code-bg)] px-3 py-2 font-mono text-[0.8rem] leading-relaxed text-fg outline-none focus:border-line-strong"
          />
        )}
      </div>
    </NodeViewWrapper>
  );
}
