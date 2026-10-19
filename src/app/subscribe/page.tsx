import type { Metadata } from "next";
import { GH_REPO_URL, SITE } from "@/lib/site";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { Subscribe } from "@/components/site/Subscribe";

export const metadata: Metadata = {
  title: "Subscribe",
  description: "Follow new posts by RSS, JSON Feed, email, or GitHub.",
  alternates: { canonical: "/subscribe" },
};

const FEEDS = [
  ["RSS", `${SITE.url}/rss.xml`, "Full post content. Works with any reader."],
  ["JSON Feed", `${SITE.url}/feed.json`, "Same content, as JSON."],
  ["Posts API", `${SITE.url}/api/posts`, "Every post's metadata, for scripts."],
  ["GitHub", `${GH_REPO_URL}/issues?q=label%3Apublished`, "Every post is an issue. Watch the repo for new ones."],
];

export default function SubscribePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-6">
      <PageHeader path="subscribe" title="Subscribe">
        <p>I publish when I have something worth saying, not on a schedule. These are the ways to hear about it.</p>
      </PageHeader>
      <Subscribe compact />
      <section className="mt-16" aria-labelledby="feeds">
        <SectionTitle>
          <span id="feeds">Feeds</span>
        </SectionTitle>
        <dl className="divide-y divide-line">
          {FEEDS.map(([name, url, note]) => (
            <div key={name} className="grid gap-1 py-3.5 sm:grid-cols-[8rem_1fr] sm:gap-6">
              <dt className="text-fg">{name}</dt>
              <dd>
                <a href={url} className="break-all font-mono text-sm text-muted hover:text-accent">
                  {url.replace(/^https?:\/\//, "")}
                </a>
                <p className="mt-0.5 text-sm text-faint">{note}</p>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
