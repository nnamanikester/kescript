"use client";

/**
 * "/" opens a block menu, Notion-style. The suggestion plugin drives a tiny
 * external store; <SlashMenu> renders it. One editor per page, so module
 * state is fine.
 */
import { Extension, type Editor, type Range } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion from "@tiptap/suggestion";
import {
  Code2,
  Columns3,
  Divide,
  FileCode2,
  Heading2,
  Heading3,
  Heading4,
  Image,
  Info,
  Lightbulb,
  List,
  ListChecks,
  ListOrdered,
  MessageSquareWarning,
  Minus,
  OctagonAlert,
  PanelTopOpen,
  Pilcrow,
  Quote,
  Sigma,
  Table2,
  TriangleAlert,
  Workflow,
  Clapperboard,
  type LucideIcon,
} from "lucide-react";
import { XIcon } from "@/components/ui/brand-icons";

export interface SlashItem {
  title: string;
  hint: string;
  group: string;
  icon: LucideIcon | typeof XIcon;
  keywords?: string;
  run: (editor: Editor, range: Range) => void;
}

const chain = (editor: Editor, range: Range) => editor.chain().focus().deleteRange(range);

function nextFootnote(editor: Editor): string {
  let max = 0;
  editor.state.doc.descendants((n) => {
    if (n.type.name === "footnoteRef") max = Math.max(max, Number(n.attrs.id) || 0);
    if (n.type.name === "rawBlock") for (const m of String(n.attrs.source).matchAll(/\[\^(\d+)\]:/g)) max = Math.max(max, Number(m[1]));
  });
  return String(max + 1);
}

const callout = (kind: string, icon: LucideIcon, hint: string): SlashItem => ({
  title: kind[0].toUpperCase() + kind.slice(1),
  hint,
  group: "Callouts",
  icon,
  keywords: `callout alert admonition ${kind}`,
  run: (e, r) => chain(e, r).insertContent({ type: "callout", attrs: { kind }, content: [{ type: "paragraph" }] }).run(),
});

export const SLASH_ITEMS: SlashItem[] = [
  { title: "Text", hint: "Plain paragraph", group: "Basics", icon: Pilcrow, keywords: "paragraph p", run: (e, r) => chain(e, r).setParagraph().run() },
  { title: "Heading", hint: "Section · ##", group: "Basics", icon: Heading2, keywords: "h2 title section", run: (e, r) => chain(e, r).setHeading({ level: 2 }).run() },
  { title: "Subheading", hint: "###", group: "Basics", icon: Heading3, keywords: "h3", run: (e, r) => chain(e, r).setHeading({ level: 3 }).run() },
  { title: "Small heading", hint: "####", group: "Basics", icon: Heading4, keywords: "h4", run: (e, r) => chain(e, r).setHeading({ level: 4 }).run() },
  { title: "Bulleted list", hint: "- item", group: "Basics", icon: List, keywords: "ul unordered", run: (e, r) => chain(e, r).toggleBulletList().run() },
  { title: "Numbered list", hint: "1. item", group: "Basics", icon: ListOrdered, keywords: "ol ordered", run: (e, r) => chain(e, r).toggleOrderedList().run() },
  { title: "Checklist", hint: "[ ] todo", group: "Basics", icon: ListChecks, keywords: "task todo checkbox", run: (e, r) => chain(e, r).toggleTaskList().run() },
  { title: "Quote", hint: "> quote", group: "Basics", icon: Quote, keywords: "blockquote", run: (e, r) => chain(e, r).toggleBlockquote().run() },
  { title: "Divider", hint: "---", group: "Basics", icon: Minus, keywords: "hr rule separator", run: (e, r) => chain(e, r).setHorizontalRule().run() },

  { title: "Image", hint: "Upload, drop or link", group: "Media", icon: Image, keywords: "picture photo screenshot figure", run: (e, r) => chain(e, r).insertContent({ type: "figure" }).run() },
  { title: "YouTube", hint: "Embed a video", group: "Media", icon: Clapperboard, keywords: "video embed", run: (e, r) => chain(e, r).insertContent({ type: "embed" }).run() },
  { title: "Post on X", hint: "Embed a tweet", group: "Media", icon: XIcon, keywords: "tweet twitter embed", run: (e, r) => chain(e, r).insertContent({ type: "embed" }).run() },

  { title: "Code", hint: "Highlighted, with filename", group: "Code", icon: Code2, keywords: "code block snippet pre ```", run: (e, r) => chain(e, r).setCodeBlock().run() },
  {
    title: "Code tabs",
    hint: "Same idea, several languages",
    group: "Code",
    icon: Columns3,
    keywords: "code group tabs variants npm pnpm",
    run: (e, r) =>
      chain(e, r)
        .insertContent({
          type: "codeGroup",
          content: [
            { type: "codeBlock", attrs: { language: "ts", meta: 'title="TypeScript"' } },
            { type: "codeBlock", attrs: { language: "py", meta: 'title="Python"' } },
          ],
        })
        .run(),
  },
  {
    title: "Install command",
    hint: "npm, pnpm, yarn and bun tabs",
    group: "Code",
    icon: FileCode2,
    keywords: "npm2yarn install package manager",
    run: (e, r) =>
      chain(e, r)
        .insertContent({ type: "codeBlock", attrs: { language: "sh", meta: "npm2yarn" }, content: [{ type: "text", text: "npm install " }] })
        .run(),
  },
  {
    title: "Diagram",
    hint: "Mermaid, previewed live",
    group: "Code",
    icon: Workflow,
    keywords: "mermaid flowchart sequence chart graph",
    run: (e, r) =>
      chain(e, r)
        .insertContent({ type: "codeBlock", attrs: { language: "mermaid", meta: "" }, content: [{ type: "text", text: "flowchart LR\n  A[Idea] --> B[Draft] --> C[Publish]" }] })
        .run(),
  },

  callout("note", Info, "Context worth knowing"),
  callout("tip", Lightbulb, "A better way to do it"),
  callout("important", MessageSquareWarning, "Don't skip this"),
  callout("warning", TriangleAlert, "This can bite"),
  callout("caution", OctagonAlert, "This can break things"),

  { title: "Table", hint: "3 × 3, header row", group: "More", icon: Table2, keywords: "grid columns rows", run: (e, r) => chain(e, r).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { title: "Equation", hint: "LaTeX block · or type $x$ inline", group: "More", icon: Sigma, keywords: "math latex katex formula", run: (e, r) => chain(e, r).insertContent({ type: "mathBlock" }).run() },
  {
    title: "Footnote",
    hint: "Reference here, note at the end",
    group: "More",
    icon: Divide,
    keywords: "footnote reference citation",
    run: (e, r) => {
      const id = nextFootnote(e);
      chain(e, r).insertContent({ type: "footnoteRef", attrs: { id } }).run();
      e.chain()
        .insertContentAt(e.state.doc.content.size, { type: "rawBlock", attrs: { source: `[^${id}]: ` } })
        .run();
    },
  },
  {
    title: "Collapsible",
    hint: "Fold an aside away",
    group: "More",
    icon: PanelTopOpen,
    keywords: "details summary toggle accordion",
    run: (e, r) =>
      chain(e, r)
        .insertContent({ type: "details", attrs: { summary: "", open: false }, content: [{ type: "paragraph" }] })
        .run(),
  },
  { title: "Markdown / HTML", hint: "Write it raw", group: "More", icon: FileCode2, keywords: "raw html markdown source", run: (e, r) => chain(e, r).insertContent({ type: "rawBlock" }).run() },
];

function filter(query: string): SlashItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return SLASH_ITEMS;
  return SLASH_ITEMS.filter((i) => `${i.title} ${i.keywords ?? ""} ${i.group}`.toLowerCase().includes(q));
}

/* ─────────────────────────────── store ─────────────────────────────── */

export interface SlashState {
  open: boolean;
  items: SlashItem[];
  index: number;
  rect: DOMRect | null;
}

let state: SlashState = { open: false, items: [], index: 0, rect: null };
let command: ((item: SlashItem) => void) | null = null;
const listeners = new Set<() => void>();

function set(next: Partial<SlashState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export const slashStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
  get: () => state,
  select(i: number) {
    const item = state.items[i];
    if (item) command?.(item);
  },
  hover(i: number) {
    if (i !== state.index) set({ index: i });
  },
};

export const SlashCommand = Extension.create({
  name: "slashCommand",
  addProseMirrorPlugins() {
    return [
      Suggestion<SlashItem, SlashItem>({
        editor: this.editor,
        char: "/",
        pluginKey: new PluginKey("slash"),
        allow: ({ state: s }) => s.selection.$from.parent.type.name === "paragraph",
        items: ({ query }) => filter(query),
        command: ({ editor, range, props }) => props.run(editor, range),
        render: () => ({
          onStart: (p) => {
            command = p.command;
            set({ open: true, items: p.items, index: 0, rect: p.clientRect?.() ?? null });
          },
          onUpdate: (p) => {
            command = p.command;
            set({ items: p.items, index: 0, rect: p.clientRect?.() ?? state.rect });
          },
          onKeyDown: ({ event }) => {
            if (!state.open) return false;
            const n = state.items.length;
            if (event.key === "ArrowDown" && n) return set({ index: (state.index + 1) % n }), true;
            if (event.key === "ArrowUp" && n) return set({ index: (state.index - 1 + n) % n }), true;
            if (event.key === "Enter" || event.key === "Tab") {
              if (!n) return false;
              slashStore.select(state.index);
              return true;
            }
            if (event.key === "Escape") return set({ open: false }), true;
            return false;
          },
          onExit: () => {
            command = null;
            set({ open: false });
          },
        }),
      }),
    ];
  },
});
