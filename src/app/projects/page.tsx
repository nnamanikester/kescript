import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { PROJECTS } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Projects",
  description: "Selected work: the problem, the approach, and what happened.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-6">
      <PageHeader path="projects" title="Projects">
        <p>Selected work, written up the way I&apos;d want to read it: the problem, what I did, and what happened.</p>
      </PageHeader>

      <nav aria-label="Projects" className="mb-12 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-faint">
        {PROJECTS.map((p) => (
          <a key={p.slug} href={`#${p.slug}`} className="hover:text-fg">
            {p.slug}
          </a>
        ))}
      </nav>

      <div className="space-y-6">
        {PROJECTS.map((p) => (
          <article key={p.slug} id={p.slug} className="scroll-mt-24 rounded-2xl border border-line bg-elev">
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-4 sm:px-6">
              <h2 className="text-lg font-semibold tracking-tight text-fg">{p.name}</h2>
              <p className="font-mono text-xs text-faint">
                {p.kind} · {p.year}
              </p>
            </header>
            <div className="space-y-5 px-5 py-5 sm:px-6">
              <p className="text-[1.0rem] leading-relaxed text-fg">{p.summary}</p>
              <dl className="grid gap-5 text-sm leading-relaxed sm:grid-cols-[6.5rem_1fr] sm:gap-x-6">
                <dt className="label pt-0.5">Problem</dt>
                <dd className="-mt-3 text-muted sm:mt-0">{p.problem}</dd>
                <dt className="label pt-0.5">Approach</dt>
                <dd className="-mt-3 sm:mt-0">
                  <ul className="space-y-1.5 text-muted">
                    {p.approach.map((a) => (
                      <li key={a} className="flex gap-2.5">
                        <span className="mt-[0.6rem] h-px w-2.5 shrink-0 bg-faint" aria-hidden />
                        {a}
                      </li>
                    ))}
                  </ul>
                </dd>
                {p.outcome && (
                  <>
                    <dt className="label pt-0.5">Outcome</dt>
                    <dd className="-mt-3 text-muted sm:mt-0">{p.outcome}</dd>
                  </>
                )}
              </dl>
            </div>
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line px-5 py-3.5 sm:px-6">
              <ul className="flex flex-wrap gap-1.5">
                {p.stack.map((s) => (
                  <li key={s} className="rounded-md bg-subtle px-2 py-0.5 font-mono text-[0.72rem] text-muted">
                    {s}
                  </li>
                ))}
              </ul>
              {p.links?.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs text-faint hover:text-accent"
                >
                  {l.label} <ArrowUpRight className="h-3 w-3" />
                </a>
              ))}
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
