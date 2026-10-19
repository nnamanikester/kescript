/**
 * One markdown pipeline, two trust levels.
 *
 *  - Posts come from approved posters, so raw HTML is allowed and the result
 *    is a hast tree that React renders with interactive components.
 *  - Comments come from anyone on GitHub, so they are sanitised *before*
 *    syntax highlighting and serialised to an HTML string.
 */
import { unified, type PluggableList } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkGemoji from "remark-gemoji";
import remarkGithub from "remark-github";
import remarkToc from "remark-toc";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeSanitize, { defaultSchema, type Options as SanitizeSchema } from "rehype-sanitize";
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationFocus,
  transformerNotationErrorLevel,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import type { Root as HRoot } from "hast";
import { GH_REPO_URL, SITE } from "@/lib/site";
import {
  preprocessCodeGroups,
  rehypeCodeGroups,
  rehypeCodeMeta,
  rehypeCollectHeadings,
  rehypeExternalLinks,
  rehypeFigures,
  rehypeRestoreCodeMeta,
  rehypeStashCodeMeta,
  remarkAlerts,
  remarkCodeExtras,
  remarkEmbeds,
  type TocHeading,
} from "./plugins";

export const CODE_THEMES = { light: "github-light", dark: "vesper" } as const;

const prettyCode: PrettyCodeOptions = {
  theme: CODE_THEMES,
  keepBackground: false,
  defaultLang: { block: "plaintext" },
  transformers: [
    transformerNotationDiff({ matchAlgorithm: "v3" }),
    transformerNotationHighlight({ matchAlgorithm: "v3" }),
    transformerNotationWordHighlight({ matchAlgorithm: "v3" }),
    transformerNotationFocus({ matchAlgorithm: "v3" }),
    transformerNotationErrorLevel({ matchAlgorithm: "v3" }),
  ],
};

const remarkCommon: PluggableList = [
  remarkGfm,
  remarkGemoji,
  [remarkGithub, { repository: GH_REPO_URL }],
];

const postProcessor = unified()
  .use(remarkParse)
  .use(remarkCommon)
  .use(remarkMath)
  .use(remarkToc, { heading: "(table[ -]of[ -])?contents?|toc", tight: true, maxDepth: 3 })
  .use(remarkAlerts)
  .use(remarkEmbeds)
  .use(remarkCodeExtras)
  .use(remarkRehype, { allowDangerousHtml: true, footnoteLabel: "Footnotes", footnoteBackLabel: "Back to reference" })
  .use(rehypeStashCodeMeta)
  .use(rehypeRaw)
  .use(rehypeRestoreCodeMeta)
  .use(rehypeSlug)
  .use(rehypeCollectHeadings)
  .use(rehypeAutolinkHeadings, {
    behavior: "append",
    properties: { className: ["heading-anchor"], ariaLabel: "Link to this section", tabIndex: -1 },
    content: { type: "text", value: "#" },
  })
  .use(rehypeKatex, { strict: false })
  .use(rehypeFigures)
  .use(rehypePrettyCode, prettyCode)
  .use(rehypeCodeMeta)
  .use(rehypeCodeGroups)
  .use(rehypeExternalLinks(SITE.url));

export interface RenderedPost {
  tree: HRoot;
  headings: TocHeading[];
}

export async function processPost(markdown: string): Promise<RenderedPost> {
  const file = { value: preprocessCodeGroups(markdown), data: {} as Record<string, unknown> };
  const mdast = postProcessor.parse(file.value);
  const tree = (await postProcessor.run(mdast, file as never)) as unknown as HRoot;
  return { tree, headings: (file.data.headings as TocHeading[]) ?? [] };
}

/** GitHub-flavoured, but nothing executable survives. */
const commentSchema: SanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ["className", /^language-./]],
    img: [...(defaultSchema.attributes?.img ?? []), "width", "height", "loading"],
  },
};

const commentProcessor = unified()
  .use(remarkParse)
  .use(remarkCommon)
  // "$5 and $10" in a comment is money, not maths.
  .use(remarkMath, { singleDollarTextMath: false })
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeStashCodeMeta)
  .use(rehypeRaw)
  .use(rehypeRestoreCodeMeta)
  .use(rehypeSanitize, commentSchema)
  .use(rehypePrettyCode, prettyCode)
  .use(rehypeCodeMeta)
  .use(rehypeExternalLinks(SITE.url))
  .use(rehypeStringify);

export async function renderCommentHtml(markdown: string): Promise<string> {
  return String(await commentProcessor.process(markdown));
}
