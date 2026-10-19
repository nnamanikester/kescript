/**
 * Small, single-purpose unified plugins. Each one maps a markdown convention
 * onto an element the renderer knows how to draw (see components.tsx).
 *
 * Custom elements carry their inputs as data-* attributes so they survive
 * rehype-raw's HTML round-trip unchanged.
 */
import type { Root as MdRoot, Code, Paragraph, Blockquote, Text, Link, RootContent, Html } from "mdast";
import type { Root as HRoot, Element, ElementContent } from "hast";
import { visit, SKIP } from "unist-util-visit";
import { toString as hastToString } from "hast-util-to-string";
import { toString as mdToString } from "mdast-util-to-string";

/* ───────────────────────────── remark (mdast) ───────────────────────────── */

const ALERTS = ["note", "tip", "important", "warning", "caution"] as const;

/** GitHub alerts: `> [!NOTE]` ... -> <aside data-callout="note"> */
export function remarkAlerts() {
  return (tree: MdRoot) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const first = node.children[0];
      if (first?.type !== "paragraph") return;
      const head = first.children[0];
      if (head?.type !== "text") return;
      const match = head.value.match(/^\[!(\w+)\][ \t]*(?:\n|$)/);
      if (!match) return;
      const kind = match[1].toLowerCase();
      if (!(ALERTS as readonly string[]).includes(kind)) return;

      head.value = head.value.slice(match[0].length);
      if (!head.value) first.children.shift();
      if (first.children[0]?.type === "break") first.children.shift();
      if (first.children.length === 0) node.children.shift();
      node.data = { hName: "aside", hProperties: { dataCallout: kind } };
    });
  };
}

function youtubeId(input: string): string | null {
  const m = input.match(
    /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (m) return m[1];
  return /^[\w-]{11}$/.test(input) ? input : null;
}

function tweetId(input: string): string | null {
  const m = input.match(/^(?:https?:\/\/)?(?:www\.|mobile\.)?(?:twitter|x)\.com\/\w+\/status(?:es)?\/(\d+)/);
  if (m) return m[1];
  return /^\d{6,}$/.test(input) ? input : null;
}

function embedFor(source: string): { hName: string; hProperties: Record<string, string> } | null {
  const shortcode = source.match(/^\{%\s*(youtube|tweet|twitter)\s+(\S+?)\s*%\}$/);
  const [kind, arg] = shortcode ? [shortcode[1], shortcode[2]] : [null, source];
  if (kind !== "tweet" && kind !== "twitter") {
    const id = youtubeId(arg);
    if (id && (kind === "youtube" || /youtu/.test(arg))) return { hName: "youtube-embed", hProperties: { dataId: id } };
  }
  if (kind !== "youtube") {
    const id = tweetId(arg);
    if (id && (kind || /(twitter|x)\.com/.test(arg))) return { hName: "tweet-embed", hProperties: { dataId: id } };
  }
  return null;
}

/**
 * Embeds. Either the swyxkit/Liquid shortcodes on their own line
 *   {% youtube dQw4w9WgXcQ %}   {% tweet 1234567890 %}
 * or a bare YouTube / X link alone in a paragraph.
 */
export function remarkEmbeds() {
  return (tree: MdRoot) => {
    visit(tree, "paragraph", (node: Paragraph) => {
      const only = node.children[0];
      let source: string | null = null;
      const text = mdToString(node).trim();
      if (/^\{%.*%\}$/.test(text)) source = text;
      else if (node.children.length !== 1) return;
      else if (only.type === "text") source = only.value.trim();
      else if (only.type === "link") {
        const text = (only as Link).children.map((c) => (c as Text).value ?? "").join("");
        if (text === only.url || text.replace(/^https?:\/\//, "") === only.url.replace(/^https?:\/\//, "")) {
          source = only.url;
        }
      }
      if (!source) return;
      const embed = embedFor(source);
      if (!embed) return;
      node.data = embed;
      node.children = [];
    });
  };
}

/* npm -> pnpm / yarn / bun, one command per line. */
function convertCommand(line: string, pm: "pnpm" | "yarn" | "bun"): string {
  const m = line.match(/^(\s*(?:\$\s*)?)(npm|npx)\s+(.*)$/);
  if (!m) return line;
  const [, lead, bin, rest] = m;
  if (bin === "npx") return lead + { pnpm: "pnpm dlx", yarn: "yarn dlx", bun: "bunx" }[pm] + " " + rest;

  const [cmd, ...args] = rest.split(/\s+/);
  const dev = args.some((a) => a === "-D" || a === "--save-dev");
  const pkgs = args.filter((a) => a !== "-D" && a !== "--save-dev" && a !== "--save" && a !== "-S");
  const devFlag = dev ? (pm === "bun" ? " -d" : " -D") : "";
  const tail = pkgs.length ? " " + pkgs.join(" ") : "";

  switch (cmd) {
    case "i":
    case "install":
    case "add":
      if (!pkgs.length) return lead + (pm === "yarn" ? "yarn" : `${pm} install`);
      return lead + `${pm} add${devFlag}${tail}`;
    case "ci":
      return lead + { pnpm: "pnpm install --frozen-lockfile", yarn: "yarn install --immutable", bun: "bun install --frozen-lockfile" }[pm];
    case "uninstall":
    case "remove":
    case "rm":
      return lead + `${pm} remove${tail}`;
    case "run":
      return lead + (pm === "bun" ? "bun run" : pm) + tail;
    case "create":
    case "init":
    case "exec":
      return lead + `${pm} ${cmd === "exec" ? (pm === "bun" ? "x" : "exec") : cmd}${tail}`;
    default:
      return lead + `${pm} ${rest}`;
  }
}

export function npmTo(code: string, pm: "pnpm" | "yarn" | "bun"): string {
  return code
    .split("\n")
    .map((l) => convertCommand(l, pm))
    .join("\n");
}

const SHELL = new Set(["sh", "bash", "shell", "zsh", "console", "terminal"]);

/**
 * Fenced-code extras.
 *  - ```mermaid           -> <mermaid-diagram>
 *  - ```sh npm2yarn (or `pm`) -> code group with npm / pnpm / yarn / bun tabs
 */
export function remarkCodeExtras() {
  return (tree: MdRoot) => {
    visit(tree, "code", (node: Code, index, parent) => {
      if (!parent || index === undefined) return;

      if (node.lang === "mermaid") {
        parent.children[index] = {
          type: "paragraph",
          children: [],
          data: { hName: "mermaid-diagram", hProperties: { dataChart: node.value } },
        } as Paragraph;
        return SKIP;
      }

      const meta = node.meta ?? "";
      if (node.lang && SHELL.has(node.lang) && /(^|\s)(npm2yarn|pm)(\s|$)/.test(meta)) {
        const rest = meta.replace(/(^|\s)(npm2yarn|pm)(?=\s|$)/g, " ").trim();
        const block = (label: string, value: string): Code => ({
          type: "code",
          lang: node.lang,
          meta: `${rest} title="${label}"`.trim(),
          value,
        });
        const group: RootContent[] = [
          { type: "html", value: '<div data-code-group="">' } as Html,
          block("npm", node.value),
          block("pnpm", npmTo(node.value, "pnpm")),
          block("yarn", npmTo(node.value, "yarn")),
          block("bun", npmTo(node.value, "bun")),
          { type: "html", value: "</div>" } as Html,
        ];
        parent.children.splice(index, 1, ...(group as typeof parent.children));
        return [SKIP, index + group.length];
      }
    });
  };
}

/**
 * `:::code-group` ... `:::` (VitePress syntax) -> <div data-code-group>.
 * Done on the source string so we don't need remark-directive, which would
 * otherwise swallow innocent text such as `ratio a:b`.
 */
export function preprocessCodeGroups(md: string): string {
  // [ \t]* rather than \s*: \s would eat the blank line after the fence and glue
  // the next paragraph onto the closing </div> as raw HTML.
  return md.replace(/^:::[ \t]*code-group[^\n]*\n([\s\S]*?)^:::[ \t]*$/gm, (_, inner: string) => {
    return `<div data-code-group="">\n\n${inner.trim()}\n\n</div>\n`;
  });
}

/* ───────────────────────────── rehype (hast) ────────────────────────────── */

function isElement(node: unknown, tag?: string): node is Element {
  return (
    typeof node === "object" &&
    node !== null &&
    (node as Element).type === "element" &&
    (!tag || (node as Element).tagName === tag)
  );
}

function isBlank(node: ElementContent): boolean {
  return node.type === "text" && !node.value.trim();
}

/**
 * rehype-pretty-code writes data attributes under their literal names
 * ("data-language") rather than hast's camelCase ("dataLanguage"). Read both.
 */
function attr(node: Element, name: string): unknown {
  const camel = name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  return node.properties[name] ?? node.properties[camel];
}

function isCodeFigure(node: unknown): node is Element {
  return isElement(node, "figure") && attr(node, "data-rehype-pretty-code-figure") !== undefined;
}

/**
 * rehype-raw rebuilds the tree through parse5 and drops `code.data.meta`
 * (titles, line highlights). Stash it as an attribute before, restore after.
 */
export function rehypeStashCodeMeta() {
  return (tree: HRoot) => {
    visit(tree, "element", (node: Element) => {
      const meta = (node.data as { meta?: string } | undefined)?.meta;
      if (node.tagName === "code" && meta) node.properties.dataCodeMeta = meta;
    });
  };
}

export function rehypeRestoreCodeMeta() {
  return (tree: HRoot) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "code" || node.properties.dataCodeMeta === undefined) return;
      node.data = { ...node.data, meta: String(node.properties.dataCodeMeta) } as Element["data"];
      delete node.properties.dataCodeMeta;
    });
  };
}

/** A paragraph holding only an image becomes <figure>, with the title as caption. */
export function rehypeFigures() {
  return (tree: HRoot) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "p" || !parent || index === undefined) return;
      const kids = node.children.filter((c) => !isBlank(c));
      if (kids.length !== 1) return;
      let img = kids[0];
      let link: Element | null = null;
      if (isElement(img, "a") && img.children.filter((c) => !isBlank(c)).length === 1) {
        link = img;
        img = img.children.find((c) => !isBlank(c))!;
      }
      if (!isElement(img, "img")) return;
      const caption = String(img.properties.title ?? "");
      delete img.properties.title;
      const figure: Element = {
        type: "element",
        tagName: "figure",
        properties: { dataImage: "" },
        children: [
          link ?? img,
          ...(caption
            ? [{ type: "element", tagName: "figcaption", properties: {}, children: [{ type: "text", value: caption }] } as Element]
            : []),
        ],
      };
      parent.children[index] = figure;
      return SKIP;
    });
  };
}

export interface TocHeading {
  id: string;
  text: string;
  depth: number;
}

/** Collect h2/h3 into file.data.headings. Must run after rehype-slug, before autolinking. */
export function rehypeCollectHeadings() {
  return (tree: HRoot, file: { data: Record<string, unknown> }) => {
    const headings: TocHeading[] = [];
    visit(tree, "element", (node: Element) => {
      if ((node.tagName === "h2" || node.tagName === "h3") && node.properties.id) {
        headings.push({ id: String(node.properties.id), text: hastToString(node).trim(), depth: Number(node.tagName[1]) });
      }
    });
    file.data.headings = headings;
  };
}

/**
 * After rehype-pretty-code: lift the title and language onto the <figure> so
 * the CodeBlock component can draw its own header, and count lines so long
 * blocks can collapse.
 */
export function rehypeCodeMeta() {
  return (tree: HRoot) => {
    visit(tree, "element", (node: Element) => {
      if (!isCodeFigure(node)) return;
      const caption = node.children.find((c) => isElement(c, "figcaption")) as Element | undefined;
      const pre = node.children.find((c) => isElement(c, "pre")) as Element | undefined;
      if (caption) {
        node.properties.dataTitle = hastToString(caption).trim();
        node.children = node.children.filter((c) => c !== caption);
      }
      if (pre) {
        node.properties.dataLanguage = String(attr(pre, "data-language") ?? "plaintext");
        let lines = 0;
        visit(pre, "element", (el: Element) => {
          if (attr(el, "data-line") !== undefined) lines++;
        });
        node.properties.dataLines = String(lines);
      }
    });
  };
}

/** <div data-code-group> -> tab labels taken from each block's title (or language). */
export function rehypeCodeGroups() {
  return (tree: HRoot) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "div" || !("dataCodeGroup" in node.properties)) return;
      const blocks = node.children.filter(isCodeFigure);
      for (const b of blocks) b.properties.dataGrouped = "";
      node.children = blocks;
      node.properties.dataLabels = JSON.stringify(
        blocks.map((b, i) => String(b.properties.dataTitle ?? b.properties.dataLanguage ?? `Tab ${i + 1}`)),
      );
    });
  };
}

/** Open external links in a new tab, safely. */
export function rehypeExternalLinks(siteUrl: string) {
  return () => (tree: HRoot) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "a") return;
      const href = String(node.properties.href ?? "");
      if (/^https?:\/\//.test(href) && !href.startsWith(siteUrl)) {
        node.properties.target = "_blank";
        node.properties.rel = ["noopener", "noreferrer"];
      }
    });
  };
}
