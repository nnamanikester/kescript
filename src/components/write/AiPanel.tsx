"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Slice } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import { ArrowUp, CornerDownLeft, ListPlus, Loader2, RotateCcw, WandSparkles, X } from "lucide-react";
import { docToMarkdown, markdownToDoc } from "@/lib/editor/markdown";
import { askAI } from "./ai";

const QUICK = [
  ["Improve", "Improve the writing: clearer, tighter, same meaning."],
  ["Shorten", "Make it shorter without losing anything important."],
  ["Fix grammar", "Fix spelling, grammar and punctuation only. Change nothing else."],
  ["Simplify", "Rewrite it in simpler words for someone new to the topic."],
  ["Link posts", "Add links to my related posts where they genuinely help. Keep the text otherwise the same."],
] as const;

/** Where the request was made, so the answer lands there even if the selection moves. */
interface Target {
  from: number;
  to: number;
  doc: PMNode;
}

type State = { kind: "idle" } | { kind: "loading" } | { kind: "done"; text: string } | { kind: "error"; message: string };

/** The selection as markdown, so formatting, links and lists survive the round trip. */
function selectionMarkdown(editor: Editor, from: number, to: number): string {
  try {
    const doc = editor.schema.topNodeType.create(null, editor.state.doc.slice(from, to).content);
    doc.check();
    return docToMarkdown(doc.toJSON());
  } catch {
    return editor.state.doc.textBetween(from, to, "\n\n");
  }
}

export function AiPanel({ editor, title, slug, onClose }: { editor: Editor; title: string; slug: string; onClose: () => void }) {
  const [instruction, setInstruction] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const target = useRef<Target | null>(null);
  const request = useRef<AbortController | null>(null);
  const lastAsk = useRef("");

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => request.current?.abort();
  }, []);

  /** `refine` edits the last answer instead of the original selection. */
  async function run(text: string, refine = false) {
    const ask = text.trim();
    if (!ask) return;
    // The first request pins the range; follow-ups refine the same passage.
    if (!target.current) {
      const { from, to } = editor.state.selection;
      target.current = { from, to, doc: editor.state.doc };
    }
    const { from, to, doc } = target.current;
    const passage = refine && state.kind === "done" ? state.text : selectionMarkdown(editor, from, to);
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    lastAsk.current = ask;
    setInstruction(ask);
    setState({ kind: "loading" });
    try {
      const res = await askAI<{ text: string }>(
        {
          task: "edit",
          instruction: ask,
          selection: passage,
          before: doc.textBetween(Math.max(0, from - 1500), from, "\n\n"),
          after: doc.textBetween(to, Math.min(doc.content.size, to + 800), "\n\n"),
          title,
          slug,
        },
        controller.signal,
      );
      setState({ kind: "done", text: res.text });
    } catch (e) {
      if ((e as Error).name !== "AbortError") setState({ kind: "error", message: (e as Error).message });
    }
  }

  function apply(how: "replace" | "below") {
    if (state.kind !== "done" || !target.current) return;
    const { from, to, doc } = target.current;
    if (!editor.state.doc.eq(doc)) {
      setState({ kind: "error", message: "The post changed while the AI was writing. Select the text and ask again." });
      return;
    }
    const next = editor.schema.nodeFromJSON(markdownToDoc(state.text));
    if (how === "replace") {
      // Same path as pasting markdown: inline results merge into the paragraph they land in.
      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          tr.setSelection(TextSelection.create(tr.doc, from, to)).replaceSelection(Slice.maxOpen(next.content)).scrollIntoView();
          return true;
        })
        .run();
    } else {
      const $to = editor.state.doc.resolve(to);
      const at = $to.depth ? $to.after(1) : to;
      editor.chain().focus().insertContentAt(at, next.toJSON().content).run();
    }
    onClose();
  }

  const loading = state.kind === "loading";

  return (
    <div className="w-[min(30rem,calc(100vw-2rem))] p-1" onKeyDown={(e) => e.key === "Escape" && (e.preventDefault(), onClose())}>
      <form
        className="flex items-center gap-2 rounded-lg bg-subtle pl-2.5 pr-1"
        onSubmit={(e) => {
          e.preventDefault();
          // A new instruction after an answer refines that answer.
          void run(instruction, state.kind === "done" && instruction.trim() !== lastAsk.current);
        }}
      >
        <WandSparkles className="h-4 w-4 shrink-0 text-accent" aria-hidden />
        <input
          ref={inputRef}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && state.kind === "done") {
              e.preventDefault();
              apply("replace");
            }
          }}
          placeholder={state.kind === "done" ? "Refine it further…" : "Tell the AI what to do with this text…"}
          aria-label="Instruction for the AI"
          className="h-9 min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-faint"
        />
        <button
          type="submit"
          disabled={loading || !instruction.trim()}
          aria-label="Ask"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-fg text-bg transition-opacity disabled:opacity-30"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
        </button>
      </form>

      {state.kind === "idle" && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {QUICK.map(([label, ask]) => (
            <button
              key={label}
              type="button"
              onClick={() => void run(ask)}
              className="rounded-full border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="px-1.5 pb-1 pt-2.5 font-mono text-xs text-faint">Reading your posts and rewriting…</p>}

      {state.kind === "error" && <p className="px-1.5 pb-1 pt-2.5 text-xs text-danger">{state.message}</p>}

      {state.kind === "done" && (
        <>
          <div className="mt-1.5 max-h-60 overflow-y-auto whitespace-pre-wrap rounded-lg border border-line bg-bg px-3 py-2.5 text-sm leading-relaxed text-fg">
            {state.text}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => apply("replace")}
              className="flex items-center gap-1.5 rounded-full bg-fg px-3 py-1 text-xs font-medium text-bg"
            >
              Replace <CornerDownLeft className="h-3 w-3 opacity-60" aria-label="⌘ Enter" />
            </button>
            <button
              type="button"
              onClick={() => apply("below")}
              className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-muted hover:text-fg"
            >
              <ListPlus className="h-3 w-3" /> Insert below
            </button>
            <button
              type="button"
              onClick={() => void run(lastAsk.current)}
              className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-muted hover:text-fg"
            >
              <RotateCcw className="h-3 w-3" /> Try again
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Discard"
              className="ml-auto grid h-7 w-7 place-items-center rounded-full text-faint hover:bg-hover hover:text-fg"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
