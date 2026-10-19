import type { Metadata } from "next";
import Link from "next/link";
import { getTags } from "@/lib/content";
import { PageHeader } from "@/components/ui/PageHeader";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Topics",
  description: "Every topic I've written about, by number of posts.",
  alternates: { canonical: "/tags" },
};

export default async function TagsPage() {
  const tags = await getTags();
  const max = Math.max(1, ...tags.map((t) => t.count));
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-6">
      <PageHeader path="tags" title="Topics">
        <p>{tags.length} topics. Bar length is the number of posts.</p>
      </PageHeader>
      <ul className="divide-y divide-line border-y border-line">
        {tags.map(({ tag, count }) => (
          <li key={tag}>
            <Link href={`/tags/${tag}`} className="group grid grid-cols-[1fr_8rem_2rem] items-center gap-4 py-2.5 sm:grid-cols-[1fr_14rem_2rem]">
              <span className="font-mono text-sm text-muted group-hover:text-accent">#{tag}</span>
              <span className="h-1 rounded-full bg-subtle">
                <span className="block h-full rounded-full bg-line-strong transition-colors group-hover:bg-accent" style={{ width: `${(count / max) * 100}%` }} />
              </span>
              <span className="text-right font-mono text-xs text-faint">{count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
