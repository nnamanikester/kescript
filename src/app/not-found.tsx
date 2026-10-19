import type { Metadata } from "next";
import Link from "next/link";
import { NotFoundSearch } from "@/components/site/NotFoundSearch";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-24 sm:px-6">
      <p className="font-mono text-xs text-faint">
        <span className="text-danger">404</span> · not found
      </p>
      <h1 className="mt-3 text-[2.4rem] font-semibold tracking-[-0.035em] text-fg">This page doesn&apos;t exist.</h1>
      <p className="mt-4 max-w-[55ch] text-[1.0625rem] leading-relaxed text-muted">
        It may have moved, or the link was mistyped. If you followed a link from this site, that&apos;s a bug —{" "}
        <a href="https://github.com/nnamanikester/kescript/issues/new" className="link">
          tell me
        </a>
        .
      </p>
      <NotFoundSearch />
      <ul className="mt-12 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
        {[
          ["/", "home"],
          ["/blog", "writing"],
          ["/tags", "topics"],
          ["/about", "about"],
        ].map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-muted hover:text-accent">
              {href === "/" ? "~" : `~${href}`} <span className="text-faint">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
