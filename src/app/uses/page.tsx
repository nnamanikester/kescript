import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { USES } from "@/lib/data";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";

export const metadata: Metadata = pageMetadata({
  title: "Uses",
  path: "/uses",
  socialTitle: "The tools I use, and why",
  description:
    "The languages, frameworks and tools John Nnamani uses to build and ship software — React Native, TypeScript, Python, Detox, Fastlane, Next.js — and why.",
});

export default function UsesPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-6">
      <PageHeader path="uses" title="Uses">
        <p>The languages, tools and services I reach for, and why. Opinions loosely held.</p>
      </PageHeader>
      <div className="space-y-14">
        {USES.map((g) => (
          <section key={g.group} aria-label={g.group}>
            <SectionTitle>{g.group}</SectionTitle>
            <dl className="divide-y divide-line">
              {g.items.map((i) => (
                <div key={i.name} className="grid gap-1 py-3 sm:grid-cols-[13rem_1fr] sm:gap-6">
                  <dt className="text-fg">{i.name}</dt>
                  <dd className="text-sm leading-relaxed text-muted sm:text-[0.95rem]">{i.note}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}
