import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import fs from "node:fs/promises";
import path from "node:path";
import "katex/dist/katex.min.css";
import { processPost } from "@/lib/markdown/pipeline";
import { PostBody } from "@/components/post/PostBody";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = pageMetadata({
  title: "Markdown style guide",
  path: "/styleguide",
  description: "Every markdown feature this site renders, in one place.",
  noindex: true,
});

export default async function StyleGuide() {
  const source = await fs.readFile(path.join(process.cwd(), "content", "styleguide.md"), "utf8");
  const { tree } = await processPost(source);
  return (
    <div className="px-5 pb-10 sm:px-6">
      <div className="measure">
        <PageHeader path="styleguide" title="Markdown style guide">
          <p>What a post can contain. Write any of this in a GitHub issue and it renders exactly like this.</p>
        </PageHeader>
      </div>
      <div className="mx-auto max-w-[52rem]">
        <PostBody tree={tree} />
      </div>
    </div>
  );
}
