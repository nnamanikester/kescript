"use client";

import { useMemo } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { renderMath } from "./MathBlockView";

/** A small field under an inline atom while it's selected. Enter or Esc returns to the text. */
function InlineField({
  value,
  onChange,
  props,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  props: NodeViewProps;
  placeholder: string;
  label: string;
}) {
  const leave = () => {
    const pos = props.getPos();
    if (typeof pos === "number") props.editor.chain().focus().setTextSelection(pos + props.node.nodeSize).run();
  };
  return (
    <span contentEditable={false} className="absolute left-0 top-full z-20 mt-1.5 flex items-center gap-2 rounded-lg border border-line bg-elev p-1.5 shadow-card">
      <span className="pl-1 font-mono text-[0.65rem] uppercase tracking-[0.08em] text-faint">{label}</span>
      <input
        autoFocus={!value}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Escape") {
            e.preventDefault();
            leave();
          }
        }}
        placeholder={placeholder}
        spellCheck={false}
        className="w-56 rounded-md bg-subtle px-2 py-1 font-mono text-xs text-fg outline-none"
      />
    </span>
  );
}

export function MathInlineView(props: NodeViewProps) {
  const latex: string = props.node.attrs.latex;
  const html = useMemo(() => (latex.trim() ? renderMath(latex, false) : ""), [latex]);
  return (
    <NodeViewWrapper as="span" className={`writer-inline relative ${props.selected ? "is-selected" : ""}`}>
      {html ? <span contentEditable={false} dangerouslySetInnerHTML={{ __html: html }} /> : <span className="font-mono text-faint">$…$</span>}
      {props.selected && (
        <InlineField value={latex} onChange={(v) => props.updateAttributes({ latex: v })} props={props} placeholder="x^2" label="tex" />
      )}
    </NodeViewWrapper>
  );
}

export function RawInlineView(props: NodeViewProps) {
  const source: string = props.node.attrs.source;
  return (
    <NodeViewWrapper as="span" className={`writer-inline relative ${props.selected ? "is-selected" : ""}`}>
      <code contentEditable={false} className="writer-raw-inline">
        {source || "…"}
      </code>
      {props.selected && (
        <InlineField value={source} onChange={(v) => props.updateAttributes({ source: v })} props={props} placeholder="<kbd>⌘K</kbd>" label="md" />
      )}
    </NodeViewWrapper>
  );
}

export function FootnoteRefView(props: NodeViewProps) {
  const id: string = props.node.attrs.id;
  return (
    <NodeViewWrapper as="span" className={`writer-inline relative ${props.selected ? "is-selected" : ""}`}>
      <sup contentEditable={false} className="font-mono text-[0.7em] text-accent">
        [{id}]
      </sup>
      {props.selected && (
        <InlineField value={id} onChange={(v) => props.updateAttributes({ id: v.replace(/[\s\]]/g, "") })} props={props} placeholder="1" label="note" />
      )}
    </NodeViewWrapper>
  );
}
