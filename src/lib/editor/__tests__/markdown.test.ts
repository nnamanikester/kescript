import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { toHtml } from "hast-util-to-html";
import { describe, expect, it } from "vitest";
import { docToMarkdown, markdownToDoc, metaTitle, withMetaTitle } from "../markdown";
import { processPost } from "@/lib/markdown/pipeline";

const roundTrip = (md: string) => docToMarkdown(markdownToDoc(md));

/** What a reader sees — markdown spelling may differ, the rendered post must not. */
async function rendered(md: string) {
  const html = toHtml((await processPost(md)).tree);
  // Footnote/heading ids are derived from content, so they're stable; whitespace isn't.
  return html.replace(/>\s+</g, "><").replace(/\s+/g, " ").trim();
}

const fixtures = [
  path.join(process.cwd(), "content", "styleguide.md"),
  ...fs
    .readdirSync(path.join(process.cwd(), "content", "blog"))
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => path.join(process.cwd(), "content", "blog", f)),
];

describe("editor markdown bridge", () => {
  it.each(fixtures.map((f) => [path.basename(f), f]))("%s renders identically after a round trip", async (_, file) => {
    const body = matter(fs.readFileSync(file, "utf8")).content;
    expect(await rendered(roundTrip(body))).toBe(await rendered(body));
  });

  it("is stable: a second round trip changes nothing", () => {
    const body = matter(fs.readFileSync(fixtures[0], "utf8")).content;
    const once = roundTrip(body);
    expect(roundTrip(once)).toBe(once);
  });

  it("maps site extensions to editor blocks", () => {
    const doc = markdownToDoc(
      [
        "> [!WARNING]\n> Careful.",
        ":::code-group\n```ts title=\"a.ts\"\nconst a = 1\n```\n\n```py title=\"a.py\"\na = 1\n```\n:::",
        "{% youtube https://youtu.be/dQw4w9WgXcQ %}",
        "https://x.com/jack/status/20",
        '![Alt](https://e.com/a.png "Caption")',
        "$$\nE = mc^2\n$$",
        "<details><summary>More</summary>\n\nHidden\n\n</details>",
      ].join("\n\n"),
    );
    expect(doc.content?.map((n) => n.type)).toEqual([
      "callout",
      "codeGroup",
      "embed",
      "embed",
      "figure",
      "mathBlock",
      "rawBlock",
      "paragraph",
      "rawBlock",
    ]);
    expect(doc.content?.[0].attrs).toEqual({ kind: "warning" });
    expect(doc.content?.[4].attrs).toEqual({ src: "https://e.com/a.png", alt: "Alt", caption: "Caption" });
  });

  it("serialises marks without splitting links", () => {
    const md = "See [the **bold** docs](https://e.com) and `code` with ~~old~~ _new_.\n";
    expect(roundTrip(md)).toBe(md);
  });

  it("drops images still uploading and empty trailing paragraphs", () => {
    const md = docToMarkdown({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Hi" }] },
        { type: "figure", attrs: { src: "blob:http://x/1", alt: "", caption: "" } },
        { type: "paragraph" },
      ],
    });
    expect(md).toBe("Hi\n");
  });

  it("reads and writes the title inside code meta", () => {
    expect(metaTitle('title="lib/a.ts" showLineNumbers')).toBe("lib/a.ts");
    expect(withMetaTitle('title="a.ts" {1}', "b.ts")).toBe('title="b.ts" {1}');
    expect(withMetaTitle('title="a.ts" {1}', "")).toBe("{1}");
  });
});
