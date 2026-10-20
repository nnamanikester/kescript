"use client";

import { useDeferredValue } from "react";
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { ChevronDown } from "lucide-react";
import { CODE_LANGUAGES, languageInfo } from "@/lib/languages";
import { metaTitle, withMetaTitle } from "@/lib/editor/markdown";
import { Mermaid } from "@/components/post/Mermaid";

/** Same header as the published code block: language dot, picker, filename. */
export function CodeBlockView({ node, updateAttributes, editor, getPos }: NodeViewProps) {
  const lang: string = node.attrs.language || "plaintext";
  const info = languageInfo(lang);
  const pos = getPos();
  const grouped = typeof pos === "number" && editor.state.doc.resolve(pos).parent.type.name === "codeGroup";
  const options = (CODE_LANGUAGES as readonly string[]).includes(lang) ? CODE_LANGUAGES : [lang, ...CODE_LANGUAGES];
  const chart = useDeferredValue(lang === "mermaid" ? node.textContent : "");

  return (
    <NodeViewWrapper as="figure" className="code-block not-prose writer-code" data-language={lang}>
      <figcaption
        contentEditable={false}
        className="flex h-10 items-center gap-2.5 border-b border-line px-3.5 font-mono text-[0.75rem] text-faint"
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: info.color }} aria-hidden />
        <label className="relative flex items-center">
          <span className="sr-only">Language</span>
          <select
            value={lang}
            onChange={(e) => updateAttributes({ language: e.target.value === "plaintext" ? null : e.target.value })}
            className="cursor-pointer appearance-none bg-transparent pr-4 [field-sizing:content] text-muted outline-none hover:text-fg"
          >
            {options.map((l) => (
              <option key={l} value={l}>
                {languageInfo(l).name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-0 h-3 w-3" aria-hidden />
        </label>
        <span className="text-line-strong" aria-hidden>
          /
        </span>
        <input
          value={metaTitle(node.attrs.meta)}
          onChange={(e) => updateAttributes({ meta: withMetaTitle(node.attrs.meta, e.target.value) })}
          placeholder={grouped ? "Tab label" : "filename (optional)"}
          aria-label={grouped ? "Tab label" : "File name"}
          className="min-w-0 flex-1 bg-transparent text-muted outline-none placeholder:text-faint/60 focus:text-fg"
          spellCheck={false}
        />
      </figcaption>
      <pre spellCheck={false}>
        <NodeViewContent<"code"> as="code" className={`hljs language-${lang}`} />
      </pre>
      {lang === "mermaid" && chart.trim() && (
        <div contentEditable={false} className="border-t border-line bg-bg/40 p-4">
          <Mermaid data-chart={chart} />
        </div>
      )}
    </NodeViewWrapper>
  );
}
