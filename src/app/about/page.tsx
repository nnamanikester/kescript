import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EXPERIENCE } from "@/lib/data";
import { SITE } from "@/lib/site";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { BioCopy } from "@/components/site/BioCopy";

export const metadata: Metadata = {
  title: "About",
  description: `${SITE.author} is a software engineer who writes about mobile, the web platform, and LLM systems.`,
  alternates: { canonical: "/about" },
};

const SHORT_BIO = `${SITE.author} (@${SITE.handle}) is a software engineer based in ${SITE.location}. John has shipped React Native and full-stack products since 2018, now works on AI developer tooling, and writes at ${SITE.url.replace(/^https?:\/\//, "")}.`;

const TOPICS = [
  {
    title: "Mobile in production",
    body: "Performance on low-end Android, release pipelines, end-to-end tests that actually run, native modules when JavaScript isn't enough.",
  },
  {
    title: "LLM systems",
    body: "Retrieval, evaluation, and the unglamorous plumbing that makes a model useful inside a real product.",
  },
  {
    title: "TypeScript & the web",
    body: "Types as documentation, Next.js and React on the server, and APIs that are pleasant to call.",
  },
];

const PRINCIPLES = [
  ["Measure first.", "Profilers and logs before opinions. Most slow code isn't where you think it is."],
  ["Boring tools, interesting problems.", "Novelty budget goes to the product, not the stack."],
  ["Own the release.", "Code isn't done when it's merged; it's done when it's in users' hands and observable."],
  ["Write it down.", "If I had to figure it out, someone else will too. That's most of this blog."],
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-6">
      <PageHeader path="about" title="About">
        <p>Hi, I&apos;m John — {SITE.handle} on most of the internet.</p>
      </PageHeader>

      <div className="grid gap-10 sm:grid-cols-[1fr_11rem]">
        <div className="space-y-5 text-[1.0625rem] leading-[1.75] text-muted">
          <p>
            I&apos;ve been writing software for a living since 2018. Most of that time went into React Native: a
            logistics platform with separate apps for riders and customers, peer-to-peer calls over WebRTC, payment
            flows, and a meditation app whose session timer had to survive backgrounding, persistence and push notifications.
          </p>
          <p>
            Mobile is a good teacher. The phone is slow, the network is lying, and you can&apos;t hotfix a binary
            that&apos;s already on someone&apos;s device. You learn to measure before you optimise, to automate the
            release, and to test the thing users actually do.
          </p>
          <p>
            Since 2024 I&apos;ve been at Turing, working across the stack and increasingly on AI tooling: a Slack
            assistant that answers questions about a large codebase, browser automation, and the Python services
            behind them. It turns out the lessons transfer — latency is UX, and a system that says &ldquo;I don&apos;t
            know&rdquo; beats one that guesses.
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
            I write for a younger me. Sometimes that&apos;s me five years ago, staring at a crash log from a phone I
            didn&apos;t own. Sometimes it&apos;s me last month, before something finally clicked. Every post is the
            explanation I wish someone had handed me then.
          </p>
          <p>
            If you&apos;re standing where I stood — whether that was years ago or a few weeks ago — I hope it saves you
            some of the time it cost me. It&apos;s mostly about these things:
          </p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
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
