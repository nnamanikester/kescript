"use client";

import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { ChevronDown, Info, Lightbulb, MessageSquareWarning, OctagonAlert, TriangleAlert } from "lucide-react";
import { CALLOUT_KINDS, type CalloutKind } from "@/lib/editor/markdown";

export const CALLOUT_ICONS = {
  note: Info,
  tip: Lightbulb,
  important: MessageSquareWarning,
  warning: TriangleAlert,
  caution: OctagonAlert,
} as const;

export function CalloutView({ node, updateAttributes }: NodeViewProps) {
  const kind = (CALLOUT_KINDS as readonly string[]).includes(node.attrs.kind) ? (node.attrs.kind as CalloutKind) : "note";
  const Icon = CALLOUT_ICONS[kind];
  return (
    <NodeViewWrapper as="aside" className="callout" data-callout={kind}>
      <p className="callout-title" contentEditable={false}>
        <Icon className="h-3.5 w-3.5" aria-hidden />
        <label className="relative flex items-center">
          <span className="sr-only">Callout type</span>
          <select
            value={kind}
            onChange={(e) => updateAttributes({ kind: e.target.value })}
            className="cursor-pointer appearance-none bg-transparent pr-4 [field-sizing:content] uppercase tracking-[0.08em] text-inherit outline-none"
          >
            {CALLOUT_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-0 h-3 w-3" aria-hidden />
        </label>
      </p>
      <NodeViewContent className="callout-body" />
    </NodeViewWrapper>
  );
}
