/**
 * The editor's schema. Every node maps 1:1 to something the post renderer
 * understands (see src/lib/editor/markdown.ts), and renders with the same
 * classes the published post uses — so the editor *is* the post.
 */
import { Extension, InputRule, mergeAttributes, Node, type Editor, type Extensions } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder, TrailingNode } from "@tiptap/extensions";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { CalloutView } from "./nodes/CalloutView";
import { CodeBlockView } from "./nodes/CodeBlockView";
import { CodeGroupView } from "./nodes/CodeGroupView";
import { DetailsView } from "./nodes/DetailsView";
import { EmbedView } from "./nodes/EmbedView";
import { FigureView } from "./nodes/FigureView";
import { FootnoteRefView, MathInlineView, RawInlineView } from "./nodes/InlineViews";
import { MathBlockView } from "./nodes/MathBlockView";
import { RawBlockView } from "./nodes/RawBlockView";
import { SlashCommand } from "./slash";

export type UploadFn = (file: File) => Promise<string>;

/** A plain attribute stored as data-<name> so copy/paste inside the editor keeps it. */
function attr<T>(name: string, fallback: T, parse: (v: string) => T = (v) => v as T) {
  return {
    default: fallback,
    parseHTML: (el: HTMLElement) => {
      const v = el.getAttribute(`data-${name}`);
      return v === null ? fallback : parse(v);
    },
    renderHTML: (attrs: Record<string, unknown>) => ({ [`data-${name}`]: String(attrs[name] ?? "") }),
  };
}

const lowlight = createLowlight(common);

const CodeBlock = CodeBlockLowlight.extend({
  addAttributes() {
    return { ...this.parent?.(), meta: attr("meta", "") };
  },
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
}).configure({ lowlight, defaultLanguage: null, enableTabIndentation: true, tabSize: 2 });

/**
 * Enter on an empty last line inside a container block steps out below it,
 * the way it leaves a list. That's how you get back to writing after a
 * collapsible or callout.
 */
function exitOnEmptyLast(editor: Editor, names: string[]): boolean {
  const { state } = editor;
  const { $from, empty } = state.selection;
  if (!empty || $from.depth < 2) return false;
  const wrap = $from.node(-1);
  if (!names.includes(wrap.type.name) || $from.parent.type.name !== "paragraph" || $from.parent.content.size) return false;
  if (wrap.childCount < 2 || $from.index(-1) !== wrap.childCount - 1) return false;
  const tr = state.tr.delete($from.before(), $from.after());
  const after = tr.mapping.map($from.after(-1));
  tr.insert(after, state.schema.nodes.paragraph.create());
  tr.setSelection(TextSelection.create(tr.doc, after + 1)).scrollIntoView();
  editor.view.dispatch(tr);
  return true;
}

const Details = Node.create({
  name: "details",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes: () => ({
    summary: attr("summary", ""),
    open: attr("open", false, (v) => v === "true"),
  }),
  parseHTML: () => [{ tag: "div[data-details]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-details": "" }), 0],
  addNodeView: () => ReactNodeViewRenderer(DetailsView),
});

const CONTAINERS = ["details", "callout"];

/**
 * Its own extension so Enter runs before the built-in one (which would just add
 * another empty line). It also keeps a line to type on at the end of every
 * container: an image or table there would otherwise leave nowhere to click.
 */
const Containers = Extension.create({
  name: "containers",
  priority: 1000,
  addKeyboardShortcuts() {
    return { Enter: () => exitOnEmptyLast(this.editor, CONTAINERS) };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("containerTail"),
        appendTransaction: (trs, _old, state) => {
          if (!trs.some((t) => t.docChanged)) return null;
          const ends: number[] = [];
          state.doc.descendants((node, pos) => {
            if (CONTAINERS.includes(node.type.name) && node.lastChild?.type.name !== "paragraph") ends.push(pos + node.nodeSize - 1);
          });
          if (!ends.length) return null;
          const tr = state.tr;
          // Back to front, so earlier positions stay valid.
          for (const end of ends.reverse()) tr.insert(end, state.schema.nodes.paragraph.create());
          return tr;
        },
      }),
    ];
  },
});

const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes: () => ({ kind: attr("kind", "note") }),
  parseHTML: () => [{ tag: "aside[data-callout]", getAttrs: (el) => ({ kind: (el as HTMLElement).dataset.callout }) }],
  renderHTML: ({ node, HTMLAttributes }) => [
    "aside",
    mergeAttributes(HTMLAttributes, { class: "callout", "data-callout": node.attrs.kind }),
    0,
  ],
  addNodeView: () => ReactNodeViewRenderer(CalloutView),
});

const CodeGroup = Node.create({
  name: "codeGroup",
  group: "block",
  content: "codeBlock+",
  defining: true,
  parseHTML: () => [{ tag: "div[data-code-group]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-code-group": "" }), 0],
  addNodeView: () => ReactNodeViewRenderer(CodeGroupView),
});

/** Atoms: one node, edited through its own small UI. */
function atom(name: string, attrs: Record<string, ReturnType<typeof attr>>, view: Parameters<typeof ReactNodeViewRenderer>[0], inline = false) {
  return Node.create({
    name,
    group: inline ? "inline" : "block",
    inline,
    atom: true,
    selectable: true,
    draggable: !inline,
    addAttributes: () => attrs,
    parseHTML: () => [{ tag: `${inline ? "span" : "div"}[data-type="${name}"]` }],
    renderHTML: ({ HTMLAttributes }) => [inline ? "span" : "div", mergeAttributes(HTMLAttributes, { "data-type": name })],
    addNodeView: () => ReactNodeViewRenderer(view),
  });
}

const Figure = Node.create<{ upload: UploadFn | null }>({
  name: "figure",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addOptions: () => ({ upload: null }),
  addAttributes: () => ({
    src: attr("src", ""),
    alt: attr("alt", ""),
    caption: attr("caption", ""),
    width: attr<number | null>("width", null, (v) => Number(v) || null),
  }),
  parseHTML: () => [
    { tag: 'div[data-type="figure"]' },
    // Images pasted from elsewhere on the web.
    {
      tag: "img[src]",
      getAttrs: (el) => {
        const img = el as HTMLImageElement;
        return { src: img.getAttribute("src"), alt: img.alt ?? "", caption: img.title ?? "" };
      },
    },
  ],
  renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-type": "figure" })],
  addNodeView: () => ReactNodeViewRenderer(FigureView),
});

const MathInline = atom("mathInline", { latex: attr("latex", "") }, MathInlineView, true).extend({
  addInputRules() {
    // $x^2$ — but not "$5 and $10": no space just inside either dollar.
    return [
      new InputRule({
        find: /(^|[\s(])\$([^\s$](?:[^$\n]*[^\s$\\])?)\$$/,
        handler: ({ state, range, match }) => {
          state.tr.replaceWith(range.from + match[1].length, range.to, this.type.create({ latex: match[2] }));
        },
      }),
    ];
  },
});

export function editorExtensions({ upload }: { upload: UploadFn }): Extensions {
  return [
    StarterKit.configure({
      codeBlock: false,
      underline: false,
      heading: { levels: [2, 3, 4] },
      link: { openOnClick: false, autolink: true, defaultProtocol: "https", HTMLAttributes: { rel: null, target: null } },
      dropcursor: { color: "var(--accent)", width: 2 },
    }),
    Placeholder.configure({
      showOnlyCurrent: true,
      includeChildren: true,
      placeholder: ({ node, editor }) => {
        if (node.type.name === "heading") return `Heading ${node.attrs.level}`;
        if (editor.isEmpty) return "Start writing, or press / for blocks…";
        return "Press / for blocks";
      },
    }),
    TaskList.configure({ HTMLAttributes: { class: "contains-task-list" } }),
    TaskItem.configure({ nested: true, HTMLAttributes: { class: "task-list-item" } }),
    Table.extend({
      addAttributes() {
        return { ...this.parent?.(), align: { default: [], rendered: false } };
      },
    }).configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    CodeBlock,
    CodeGroup,
    Callout,
    Details,
    Containers,
    // Always a line after the last block, so you can keep writing below a collapsible, table or image.
    TrailingNode,
    Figure.configure({ upload }),
    atom("embed", { url: attr("url", ""), kind: attr("kind", "") }, EmbedView),
    atom("mathBlock", { latex: attr("latex", "") }, MathBlockView),
    atom("rawBlock", { source: attr("source", "") }, RawBlockView),
    MathInline,
    atom("rawInline", { source: attr("source", "") }, RawInlineView, true),
    atom("footnoteRef", { id: attr("id", "1") }, FootnoteRefView, true),
    SlashCommand,
  ];
}
