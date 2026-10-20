import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { EXPERIENCE } from "@/lib/data";
import { SITE } from "@/lib/site";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { BioCopy } from "@/components/site/BioCopy";
import { ProfileJsonLd } from "@/components/site/JsonLd";

export const metadata: Metadata = pageMetadata({
  title: `About ${SITE.author}`,
  path: "/about",
  socialTitle: `About ${SITE.author}`,
  description: `Software engineer in ${SITE.location} who writes letters to a younger me — about software, habits and life. Story, principles and timeline.`,
});

const SHORT_BIO = `${SITE.author} (@${SITE.handle}) is a software engineer based in ${SITE.location}. John has shipped React Native and full-stack products since 2018 — five-plus apps across the App Store and Play Store — now works on AI developer tooling, and writes at ${SITE.url.replace(/^https?:\/\//, "")}.`;

const TOPICS = [
  {
    title: "Mobile in production",
    body: "Performance on low-end Android, offline-tolerant data, motion that stays smooth, native modules when JavaScript isn't enough.",
  },
  {
    title: "Testing & shipping",
    body: "End-to-end tests that run on every build, signing and release pipelines, and getting a binary to users without drama.",
  },
  {
    title: "LLM systems",
    body: "Retrieval, evaluation, and the unglamorous plumbing that makes a model useful inside a real product.",
  },
  {
    title: "TypeScript, APIs & the web",
    body: "Types as documentation, GraphQL versus REST from someone who migrated between them, and Next.js on the server.",
  },
];

const PRINCIPLES = [
  ["Measure first.", "Profilers and logs before opinions. Most slow code isn't where you think it is."],
  ["Test what users do.", "An end-to-end test of the real flow is worth more than a dozen of the easy unit kind."],
  ["Own the release.", "Code isn't done when it's merged; it's done when it's in users' hands and observable."],
  ["Write it down.", "When I restructured a frontend, the document explaining why mattered more than the diff. Same reason this blog exists."],
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-6">
      <ProfileJsonLd />
      <PageHeader path="about" title="About">
        <p>Hi, I&apos;m John — {SITE.handle} on most of the internet.</p>
      </PageHeader>

      <div className="grid gap-10 sm:grid-cols-[1fr_11rem]">
        <div className="space-y-5 text-[1.0625rem] leading-[1.75] text-muted">
          <p>
            I&apos;ve been writing software for a living since 2018, and most of it has been React Native — five-plus
            apps through the App Store and Play Store. Checkout flows. Encrypted peer-to-peer calls over WebRTC. A
            meditation app where an interrupted session had to pick up exactly where it stopped. A logistics platform I
            helped build from nothing, rider app to ledger, where every fee and discount had to reconcile.
          </p>
          <p>
            Mobile is a good teacher. The phone is slow, the network is lying, and you can&apos;t hotfix a binary
            that&apos;s already on someone&apos;s device. So I learned to profile before optimising, to put end-to-end
            tests in the pipeline instead of on a checklist, and to own the release — at one point the CI/CD for five
            codebases at once.
          </p>
          <p>
            Since 2024 I&apos;ve been at Turing, working across the stack and increasingly on AI tooling: a Slack
            assistant that answers questions about a large codebase, a browser extension that kept a business running
            through an API outage, and the Python services behind them. The mobile lessons transfer surprisingly well.
            Latency is still UX, and caching is still most of performance.
          </p>
          <p>
            I write things down so they finally make sense to me, and in case they help whoever is a step or two behind.
            I&apos;m based in {SITE.location}.
          </p>
        </div>
        <div className="order-first sm:order-none">
          <Image
            src="/images/profile.jpg"
            alt={SITE.author}
            width={176}
            height={176}
            priority
            className="aspect-square w-32 rounded-2xl border border-line object-cover grayscale-[20%] sm:w-full"
          />
        </div>
      </div>

      <section className="mt-20" aria-labelledby="writes-about">
        <SectionTitle>
          <span id="writes-about">What I write about</span>
        </SectionTitle>
        <div className="mb-8 space-y-4 text-[1.0625rem] leading-[1.75] text-muted">
          <p>
            I created this blog as a space to publish my thoughts, document what I&apos;ve learned, and write notes to my
            younger self — whether that younger self was from 5 years ago, a month ago, or literally 2 minutes ago
            before I figured something out. The goal has always been simple: share what I learn so others don&apos;t
            have to stumble in the dark.
          </p>
          <p>Life gets a say too, but the engineering mostly lands here:</p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
          {TOPICS.map((t) => (
            <div key={t.title} className="bg-bg p-5">
              <h3 className="font-medium text-fg">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20" aria-labelledby="principles">
        <SectionTitle>
          <span id="principles">How I work</span>
        </SectionTitle>
        <dl className="space-y-5">
          {PRINCIPLES.map(([t, d], i) => (
            <div key={t} className="grid grid-cols-[2rem_1fr] gap-x-3">
              <span className="font-mono text-sm text-accent">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <dt className="font-medium text-fg">{t}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted">{d}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-20" aria-labelledby="timeline">
        <SectionTitle
          action={
            <Link href="/projects" className="font-mono text-xs text-faint transition-colors hover:text-fg">
              selected work →
            </Link>
          }
        >
          <span id="timeline">Timeline</span>
        </SectionTitle>
        <ol className="relative space-y-6 border-l border-line pl-6">
          {EXPERIENCE.map((job, i) => (
            <li key={job.company} className="relative">
              <span
                className={`absolute -left-[1.84rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-bg ${i === 0 ? "bg-accent" : "bg-line-strong"}`}
                aria-hidden
              />
              <p className="font-mono text-xs text-faint">{job.period}</p>
              <p className="mt-1 text-fg">
                {job.role} <span className="text-faint">at</span> {job.company}
              </p>
              <p className="mt-0.5 text-sm text-muted">{job.note}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-faint">BSc Computer Science, Enugu State University of Science and Technology.</p>
      </section>

      <section className="mt-20" aria-labelledby="elsewhere">
        <SectionTitle>
          <span id="elsewhere">Elsewhere</span>
        </SectionTitle>
        <ul className="grid gap-2 font-mono text-sm sm:grid-cols-2">
          {[
            ["email", SITE.email, `mailto:${SITE.email}`],
            ["github", "nnamanikester", SITE.links.github],
            ["x", SITE.twitterHandle, SITE.links.twitter],
            ["linkedin", "nnamanikester", SITE.links.linkedin],
          ].map(([k, v, href]) => (
            <li key={k}>
              <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer me" className="group flex gap-3">
                <span className="w-16 text-faint">{k}</span>
                <span className="text-muted group-hover:text-accent">{v}</span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-xl border border-line bg-elev p-5">
          <div className="flex items-start justify-between gap-4">
            <p className="label">Bio, for introductions</p>
            <BioCopy text={SHORT_BIO} />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">{SHORT_BIO}</p>
        </div>
      </section>
    </div>
  );
}
