import { describe, it, expect } from "vitest";
import { toHtml } from "hast-util-to-html";
import { processPost, renderCommentHtml } from "../pipeline";
import { npmTo, preprocessCodeGroups } from "../plugins";

async function html(md: string) {
  const { tree, headings } = await processPost(md);
  return { out: toHtml(tree), headings };
}

describe("post pipeline", () => {
  it("highlights code with title, language, and line count", async () => {
    const { out } = await html('```ts title="app.ts" showLineNumbers {2}\nconst a = 1;\nconst b = 2;\n```');
    expect(out).toContain('data-title="app.ts"');
    expect(out).toContain('data-language="ts"');
    expect(out).toContain('data-lines="2"');
    expect(out).toContain("data-highlighted-line");
    expect(out).not.toContain("<figcaption");
  });

  it("turns :::code-group into labelled tabs", async () => {
    const md = preprocessCodeGroups(':::code-group\n```js title="a.js"\n1\n```\n\n```py\n2\n```\n:::');
    const { out } = await html(md);
    expect(out).toContain("data-code-group");
    expect(out).toContain("data-labels=\"[&#x22;a.js&#x22;,&#x22;py&#x22;]\"");
  });

  it("keeps the paragraph after a code group as markdown", async () => {
    const md = preprocessCodeGroups(":::code-group\n```js\n1\n```\n:::\n\nAfter `code` here.");
    const { out } = await html(md);
    expect(out).toContain("<p>After <code>code</code> here.</p>");
  });

  it("embeds a shortcode whose argument is an autolinked URL", async () => {
    const { out } = await html("{% youtube https://www.youtube.com/watch?v=dQw4w9WgXcQ %}");
    expect(out).toContain('<youtube-embed data-id="dQw4w9WgXcQ"');
  });

  it("expands npm2yarn into four package-manager tabs", async () => {
    const { out } = await html("```sh npm2yarn\nnpm install -D vitest\n```");
    expect(out).toContain("pnpm");
    expect(out).toContain("bun");
    expect(out).toMatch(/data-labels="\[.*npm.*pnpm.*yarn.*bun.*\]"/);
  });

  it("renders GitHub alerts, footnotes, tables, task lists", async () => {
    const { out } = await html(
      "> [!WARNING]\n> Careful.\n\nText[^1]\n\n[^1]: Note.\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n- [x] done\n",
    );
    expect(out).toContain('data-callout="warning"');
    expect(out).not.toContain("[!WARNING]");
    expect(out).toContain("data-footnotes");
    expect(out).toContain("<table>");
    expect(out).toContain('type="checkbox"');
  });

  it("renders maths, mermaid, embeds and figures", async () => {
    const { out } = await html(
      "$$\nE = mc^2\n$$\n\n```mermaid\ngraph TD; A-->B\n```\n\n{% youtube dQw4w9WgXcQ %}\n\nhttps://x.com/kescript/status/1234567890\n\n![alt](/a.png \"Caption\")",
    );
    expect(out).toContain("katex");
    expect(out).toContain("<mermaid-diagram");
    expect(out).toContain('<youtube-embed data-id="dQw4w9WgXcQ"');
    expect(out).toContain('<tweet-embed data-id="1234567890"');
    expect(out).toContain("<figcaption>Caption</figcaption>");
  });

  it("sizes figures from the URL fragment", async () => {
    const { out } = await html('![alt](/a.png#w=60 "Caption")');
    expect(out).toContain('src="/a.png"');
    expect(out).toContain('style="width:60%"');
  });

  it("collects h2/h3 headings with ids", async () => {
    const { headings, out } = await html("## First `thing`\n\n### Sub\n\n#### Deep");
    expect(headings).toEqual([
      { id: "first-thing", text: "First thing", depth: 2 },
      { id: "sub", text: "Sub", depth: 3 },
    ]);
    expect(out).toContain("heading-anchor");
  });
});

describe("comment pipeline", () => {
  it("strips scripts and handlers but keeps highlighting", async () => {
    const out = await renderCommentHtml(
      '<script>alert(1)</script><img src=x onerror="alert(1)">\n\n```js\nconst x = 1\n```\n\nIt costs $5 and $10.',
    );
    expect(out).not.toContain("<script");
    expect(out).not.toContain("onerror");
    expect(out).toContain("data-rehype-pretty-code-figure");
    expect(out).toContain("$5 and $10");
  });
});

describe("npmTo", () => {
  it("converts common commands", () => {
    expect(npmTo("npm install", "yarn")).toBe("yarn");
    expect(npmTo("npm i react", "pnpm")).toBe("pnpm add react");
    expect(npmTo("npm install -D vitest", "bun")).toBe("bun add -d vitest");
    expect(npmTo("npx create-next-app", "pnpm")).toBe("pnpm dlx create-next-app");
    expect(npmTo("npm run dev", "yarn")).toBe("yarn dev");
  });
});
