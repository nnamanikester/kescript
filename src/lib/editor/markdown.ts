/**
 * Markdown <-> editor document.
 *
 * Parsing uses the same remark-parse + GFM + maths setup as the site, so the
 * editor sees a post exactly as the renderer will. Anything the editor has no
 * block for (raw HTML, footnote definitions, reference links…) becomes a raw
 * block that keeps its markdown verbatim — nothing is ever dropped.
 *
 * Serialising builds an mdast tree and lets remark-stringify do the escaping.
 * The site's own extensions (alerts, code groups, embeds) are emitted as `html`
 * nodes, which remark-stringify writes out untouched.
 */
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkStringify from "remark-stringify";
import { toString as mdToString } from "mdast-util-to-string";
import type { JSONContent } from "@tiptap/core";
import type {
  AlignType,
  BlockContent,
  Code,
  DefinitionContent,
  List,
  ListItem,
  Paragraph,
  PhrasingContent,
  Root,
  RootContent,
  Table,
  TableCell,
  TableRow,
} from "mdast";

export const CALLOUT_KINDS = ["note", "tip", "important", "warning", "caution"] as const;
export type CalloutKind = (typeof CALLOUT_KINDS)[number];

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkStringify, {
    bullet: "-",
    emphasis: "_",
    strong: "*",
    fence: "`",
    fences: true,
    rule: "-",
    listItemIndent: "one",
    incrementListMarker: true,
  });

type Flow = BlockContent | DefinitionContent;
type Mark = NonNullable<JSONContent["marks"]>[number];

/* ───────────────────────────── shared helpers ───────────────────────────── */

const SHORTCODE = /^\{%\s*(youtube|tweet|twitter)\s+(\S+?)\s*%\}$/;
const YOUTUBE = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?|embed\/|shorts\/|live\/)|youtu\.be\/)/;
const TWEET = /^(?:https?:\/\/)?(?:www\.|mobile\.)?(?:twitter|x)\.com\/\w+\/status(?:es)?\/\d+/;

export type EmbedKind = "youtube" | "tweet";

export function embedKind(url: string): EmbedKind | null {
  if (YOUTUBE.test(url)) return "youtube";
  if (TWEET.test(url)) return "tweet";
  return null;
}

export function youtubeId(url: string): string | null {
  return url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/)?.[1] ?? null;
}

/** `title="lib/retry.ts" showLineNumbers {3}` -> "lib/retry.ts" */
export function metaTitle(meta: string | null | undefined): string {
  return meta?.match(/title=(?:"([^"]*)"|'([^']*)')/)?.slice(1).find((v) => v !== undefined) ?? "";
}

export function withMetaTitle(meta: string | null | undefined, title: string): string {
  const rest = (meta ?? "").replace(/\s*title=(?:"[^"]*"|'[^']*')\s*/, " ").trim();
  const t = title.trim().replace(/"/g, "'");
  return [t ? `title="${t}"` : "", rest].filter(Boolean).join(" ");
}

function stringify(nodes: RootContent[]): string {
  return processor.stringify({ type: "root", children: nodes } as Root).trim();
}

/* ─────────────────────────────── md -> doc ──────────────────────────────── */

function text(value: string, marks: Mark[]): JSONContent {
  return marks.length ? { type: "text", text: value, marks } : { type: "text", text: value };
}

function inline(nodes: PhrasingContent[], marks: Mark[] = []): JSONContent[] {
  const out: JSONContent[] = [];
  for (const node of nodes) {
    switch (node.type) {
      case "text": {
        // Soft line breaks are just spaces once rendered.
        const value = node.value.replace(/[ \t]*\n[ \t]*/g, " ");
        if (value) out.push(text(value, marks));
        break;
      }
      case "strong":
        out.push(...inline(node.children, [...marks, { type: "bold" }]));
        break;
      case "emphasis":
        out.push(...inline(node.children, [...marks, { type: "italic" }]));
        break;
      case "delete":
        out.push(...inline(node.children, [...marks, { type: "strike" }]));
        break;
      case "inlineCode":
        if (node.value) out.push(text(node.value, [...marks, { type: "code" }]));
        break;
      case "link":
        out.push(...inline(node.children, [...marks, { type: "link", attrs: { href: node.url, title: node.title ?? null } }]));
        break;
      case "break":
        out.push({ type: "hardBreak" });
        break;
      case "inlineMath":
        out.push({ type: "mathInline", attrs: { latex: node.value } });
        break;
      case "footnoteReference":
        out.push({ type: "footnoteRef", attrs: { id: node.label ?? node.identifier } });
        break;
      case "html":
        out.push({ type: "rawInline", attrs: { source: node.value } });
        break;
      default:
        // Inline images, reference links… keep the source exactly.
        out.push({ type: "rawInline", attrs: { source: stringify([{ type: "paragraph", children: [node] }]) } });
    }
  }
  return out;
}

function paragraph(children: JSONContent[]): JSONContent {
  return children.length ? { type: "paragraph", content: children } : { type: "paragraph" };
}

function onlyChild(p: Paragraph): PhrasingContent | null {
  const kids = p.children.filter((c) => !(c.type === "text" && !c.value.trim()));
  return kids.length === 1 ? kids[0] : null;
}

function paragraphBlock(p: Paragraph): JSONContent {
  const textValue = mdToString(p).trim();
  const short = textValue.match(SHORTCODE);
  if (short) {
    const kind: EmbedKind = short[1] === "youtube" ? "youtube" : "tweet";
    return { type: "embed", attrs: { url: short[2], kind } };
  }
  const only = onlyChild(p);
  if (only?.type === "link" && mdToString(only) === only.url && embedKind(only.url)) {
    return { type: "embed", attrs: { url: only.url, kind: embedKind(only.url) } };
  }
  if (only?.type === "image") {
    return { type: "figure", attrs: { src: only.url, alt: only.alt ?? "", caption: only.title ?? "" } };
  }
  return paragraph(inline(p.children));
}

function calloutKind(node: Flow): CalloutKind | null {
  if (node.type !== "blockquote") return null;
  const first = node.children[0];
  if (first?.type !== "paragraph" || first.children[0]?.type !== "text") return null;
  const kind = first.children[0].value.match(/^\[!(\w+)\]/)?.[1]?.toLowerCase();
  return kind && (CALLOUT_KINDS as readonly string[]).includes(kind) ? (kind as CalloutKind) : null;
}

/** Remove the `[!NOTE]` marker the same way the site's remarkAlerts does. */
function stripCalloutMarker(children: Flow[]): Flow[] {
  const [first, ...rest] = children;
  if (first?.type !== "paragraph") return children;
  const head = first.children[0];
  if (head?.type !== "text") return children;
  const value = head.value.replace(/^\[!\w+\][ \t]*(?:\n|$)/, "");
  const kids = [...first.children];
  if (value) kids[0] = { ...head, value };
  else kids.shift();
  if (kids[0]?.type === "break") kids.shift();
  return kids.length ? [{ ...first, children: kids }, ...rest] : rest;
}

function codeBlock(node: Code): JSONContent {
  return {
    type: "codeBlock",
    attrs: { language: node.lang ?? null, meta: node.meta ?? "" },
    content: node.value ? [{ type: "text", text: node.value }] : undefined,
  };
}

function listItems(node: List): JSONContent {
  const task = node.children.some((i) => typeof i.checked === "boolean");
  const items = node.children.map((item: ListItem): JSONContent => {
    const content = blocks(item.children as Flow[]);
    if (content[0]?.type !== "paragraph") content.unshift({ type: "paragraph" });
    return task
      ? { type: "taskItem", attrs: { checked: Boolean(item.checked) }, content }
      : { type: "listItem", content };
  });
  if (task) return { type: "taskList", content: items };
  return node.ordered
    ? { type: "orderedList", attrs: { start: node.start ?? 1 }, content: items }
    : { type: "bulletList", content: items };
}

function table(node: Table): JSONContent {
  return {
    type: "table",
    attrs: { align: node.align ?? [] },
    content: node.children.map((row: TableRow, r) => ({
      type: "tableRow",
      content: row.children.map((cell: TableCell) => ({
        type: r === 0 ? "tableHeader" : "tableCell",
        content: [paragraph(inline(cell.children))],
      })),
    })),
  };
}

function isMarker(node: Flow | undefined, re: RegExp): boolean {
  return node?.type === "paragraph" && re.test(mdToString(node).trim());
}

function blocks(nodes: Flow[]): JSONContent[] {
  const out: JSONContent[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    // :::code-group … ::: — fenced blocks between two marker paragraphs.
    if (isMarker(node, /^:::[ \t]*code-group\b/)) {
      let j = i + 1;
      const codes: Code[] = [];
      while (nodes[j]?.type === "code") codes.push(nodes[j++] as Code);
      if (codes.length && isMarker(nodes[j], /^:::$/)) {
        out.push({ type: "codeGroup", content: codes.map(codeBlock) });
        i = j;
        continue;
      }
    }

    const kind = calloutKind(node);
    if (kind && node.type === "blockquote") {
      const inner = blocks(stripCalloutMarker(node.children as Flow[]));
      out.push({ type: "callout", attrs: { kind }, content: inner.length ? inner : [{ type: "paragraph" }] });
      continue;
    }

    switch (node.type) {
      case "paragraph":
        out.push(paragraphBlock(node));
        break;
      case "heading":
        out.push({ type: "heading", attrs: { level: Math.min(Math.max(node.depth, 2), 4) }, content: inline(node.children) });
        break;
      case "thematicBreak":
        out.push({ type: "horizontalRule" });
        break;
      case "blockquote": {
        const inner = blocks(node.children as Flow[]);
        out.push({ type: "blockquote", content: inner.length ? inner : [{ type: "paragraph" }] });
        break;
      }
      case "list": {
        // The editor's lists are all-bullets or all-checkboxes; a mix stays as written.
        const tasks = node.children.filter((item) => typeof item.checked === "boolean").length;
        if (tasks && tasks < node.children.length) out.push({ type: "rawBlock", attrs: { source: stringify([node]) } });
        else out.push(listItems(node));
        break;
      }
      case "code":
        out.push(codeBlock(node));
        break;
      case "math":
        out.push({ type: "mathBlock", attrs: { latex: node.value } });
        break;
      case "table":
        out.push(table(node));
        break;
      case "html":
        out.push({ type: "rawBlock", attrs: { source: node.value } });
        break;
      default:
        out.push({ type: "rawBlock", attrs: { source: stringify([node as RootContent]) } });
    }
  }
  return out;
}

export function markdownToDoc(markdown: string): JSONContent {
  const tree = processor.parse(markdown) as Root;
  const content = blocks(tree.children as Flow[]);
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

/* ─────────────────────────────── doc -> md ──────────────────────────────── */

/** Wrap order, outermost first: one link around bold text, not bold around three links. */
const MARK_ORDER = ["link", "bold", "italic", "strike"] as const;

function sameMark(a: Mark | undefined, b: Mark | undefined): boolean {
  if (!a || !b) return a === b;
  return a.type === b.type && (a.type !== "link" || a.attrs?.href === b.attrs?.href);
}

function phrasingLeaf(node: JSONContent): PhrasingContent[] {
  switch (node.type) {
    case "text": {
      const value = node.text ?? "";
      return node.marks?.some((m) => m.type === "code") ? [{ type: "inlineCode", value }] : [{ type: "text", value }];
    }
    case "hardBreak":
      return [{ type: "break" }];
    case "mathInline":
      return [{ type: "inlineMath", value: String(node.attrs?.latex ?? "") }];
    case "footnoteRef": {
      const id = String(node.attrs?.id ?? "1");
      return [{ type: "footnoteReference", identifier: id.toLowerCase(), label: id }];
    }
    case "rawInline":
      return [{ type: "html", value: String(node.attrs?.source ?? "") }];
    default:
      return [];
  }
}

function phrasing(nodes: JSONContent[], depth = 0): PhrasingContent[] {
  if (depth >= MARK_ORDER.length) return nodes.flatMap(phrasingLeaf);
  const type = MARK_ORDER[depth];
  const out: PhrasingContent[] = [];
  let i = 0;
  while (i < nodes.length) {
    const mark = nodes[i].marks?.find((m) => m.type === type);
    let j = i + 1;
    while (j < nodes.length && sameMark(nodes[j].marks?.find((m) => m.type === type), mark)) j++;
    const children = phrasing(nodes.slice(i, j), depth + 1);
    if (!mark) out.push(...children);
    else if (type === "link")
      out.push({ type: "link", url: String(mark.attrs?.href ?? ""), title: (mark.attrs?.title as string) || null, children });
    else if (type === "bold") out.push({ type: "strong", children });
    else if (type === "italic") out.push({ type: "emphasis", children });
    else out.push({ type: "delete", children });
    i = j;
  }
  return out;
}

const html = (value: string) => ({ type: "html", value }) as const;

function toCode(node: JSONContent): Code {
  const lang = (node.attrs?.language as string | null) || null;
  return {
    type: "code",
    lang: lang === "plaintext" ? null : lang,
    meta: (node.attrs?.meta as string) || null,
    value: (node.content ?? []).map((t) => t.text ?? "").join(""),
  };
}

function cellPhrasing(cell: JSONContent): PhrasingContent[] {
  const paras = (cell.content ?? []).filter((c) => c.type === "paragraph");
  return paras.flatMap((p, i) => [...(i ? [{ type: "text", value: " " } as PhrasingContent] : []), ...phrasing(p.content ?? [])]);
}

function toList(node: JSONContent): List {
  const ordered = node.type === "orderedList";
  const task = node.type === "taskList";
  const children = (node.content ?? []).map((item): ListItem => {
    const kids = toFlow(item.content ?? []);
    return {
      type: "listItem",
      spread: kids.filter((k) => k.type === "paragraph").length > 1,
      checked: task ? Boolean(item.attrs?.checked) : null,
      children: kids as ListItem["children"],
    };
  });
  return {
    type: "list",
    ordered,
    start: ordered ? Number(node.attrs?.start ?? 1) : null,
    spread: children.some((c) => c.spread),
    children,
  };
}

function toFlow(nodes: JSONContent[]): Flow[] {
  return nodes.flatMap((node): Flow[] => {
    switch (node.type) {
      case "paragraph":
        return [{ type: "paragraph", children: phrasing(node.content ?? []) }];
      case "heading":
        return [{ type: "heading", depth: Number(node.attrs?.level ?? 2) as 2, children: phrasing(node.content ?? []) }];
      case "horizontalRule":
        return [{ type: "thematicBreak" }];
      case "blockquote":
        return [{ type: "blockquote", children: toFlow(node.content ?? []) as BlockContent[] }];
      case "callout":
        return [
          {
            type: "blockquote",
            children: [html(`[!${String(node.attrs?.kind ?? "note").toUpperCase()}]`), ...toFlow(node.content ?? [])] as BlockContent[],
          },
        ];
      case "bulletList":
      case "orderedList":
      case "taskList":
        return [toList(node)];
      case "codeBlock":
        return [toCode(node)];
      case "codeGroup":
        return [html(":::code-group"), ...(node.content ?? []).map(toCode), html(":::")];
      case "mathBlock":
        return [{ type: "math", value: String(node.attrs?.latex ?? "") }];
      case "figure": {
        const src = String(node.attrs?.src ?? "");
        if (!src || src.startsWith("blob:")) return [];
        return [
          {
            type: "paragraph",
            children: [{ type: "image", url: src, alt: String(node.attrs?.alt ?? ""), title: (node.attrs?.caption as string) || null }],
          },
        ];
      }
      case "embed": {
        const url = String(node.attrs?.url ?? "").trim();
        if (!url) return [];
        return [html(`{% ${embedKind(url) === "tweet" ? "tweet" : "youtube"} ${url} %}`)];
      }
      case "table": {
        const align = (node.attrs?.align as AlignType[] | undefined) ?? [];
        const rows = (node.content ?? []).map(
          (row): TableRow => ({
            type: "tableRow",
            children: (row.content ?? []).map((cell): TableCell => ({ type: "tableCell", children: cellPhrasing(cell) })),
          }),
        );
        const cols = Math.max(0, ...rows.map((r) => r.children.length));
        return [{ type: "table", align: Array.from({ length: cols }, (_, i) => align[i] ?? null), children: rows }];
      }
      case "rawBlock": {
        const source = String(node.attrs?.source ?? "").trim();
        return source ? [html(source)] : [];
      }
      default:
        return [];
    }
  });
}

/** Trailing empty paragraphs are an editor artefact, not content. */
function trimEmpty(nodes: JSONContent[]): JSONContent[] {
  const out = [...nodes];
  while (out.length && out[out.length - 1].type === "paragraph" && !out[out.length - 1].content?.length) out.pop();
  return out;
}

export function docToMarkdown(doc: JSONContent): string {
  const md = stringify(toFlow(trimEmpty(doc.content ?? [])) as RootContent[]);
  return md ? md + "\n" : "";
}
