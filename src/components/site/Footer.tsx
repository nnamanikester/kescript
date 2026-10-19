import Link from "next/link";
import { Rss } from "lucide-react";
import { GitHubIcon, LinkedInIcon, XIcon } from "@/components/ui/brand-icons";
import { FOOTER_NAV, GH_REPO_URL, SITE } from "@/lib/site";
import { LocalTime } from "./LocalTime";

/** Build info, shown the way an engineer would want it: which commit is this? */
function buildInfo() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT_SHA;
  return { sha: sha?.slice(0, 7) ?? "dev", built: new Date().toISOString().slice(0, 10) };
}

const SOCIAL = [
  { href: SITE.links.github, label: "GitHub", Icon: GitHubIcon },
  { href: SITE.links.twitter, label: "X", Icon: XIcon },
  { href: SITE.links.linkedin, label: "LinkedIn", Icon: LinkedInIcon },
];

export function Footer() {
  const { sha, built } = buildInfo();
  return (
    <footer className="relative mt-32 overflow-hidden border-t border-line">
      <div className="mx-auto max-w-5xl px-5 pt-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              Notes to a <span className="font-serif text-[1.05rem] italic text-fg">younger me</span>, on building
              software. Published in case they help you too.
            </p>
            <div className="mt-5 flex items-center gap-1">
              {SOCIAL.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer me"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-transparent text-faint transition-colors hover:border-line hover:bg-elev hover:text-fg"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
              <a
                href="/rss.xml"
                aria-label="RSS"
                className="grid h-9 w-9 place-items-center rounded-full border border-transparent text-faint transition-colors hover:border-line hover:bg-elev hover:text-fg"
              >
                <Rss className="h-4 w-4" />
              </a>
            </div>
          </div>

          <nav aria-label="Footer" className="contents">
            {[FOOTER_NAV.slice(0, 4), FOOTER_NAV.slice(4)].map((col, i) => (
              <ul key={i} className="space-y-2.5 text-sm">
                {col.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="link-grow text-muted hover:text-fg">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-dashed border-line pt-5 font-mono text-[0.7rem] text-faint">
          <LocalTime city="Lisbon" />
          <span>
            build{" "}
            <a href={sha === "dev" ? GH_REPO_URL : `${GH_REPO_URL}/commit/${sha}`} className="hover:text-fg">
              {sha}
            </a>{" "}
            · {built}
          </span>
          <span className="sm:ml-auto">
            content lives in{" "}
            <a href={`${GH_REPO_URL}/issues`} className="hover:text-fg">
              GitHub issues
            </a>{" "}
            ·{" "}
            <Link href="/colophon" className="hover:text-fg">
              how this site works
            </Link>
          </span>
        </div>
      </div>

      {/* The wordmark, cropped by the bottom edge. Decorative. */}
      <div aria-hidden className="pointer-events-none mx-auto mt-8 max-w-5xl select-none px-5 sm:px-6">
        <p className="-mb-[0.22em] bg-gradient-to-b from-line-strong to-transparent bg-clip-text font-mono text-[clamp(4rem,17vw,11.5rem)] font-semibold leading-none tracking-[-0.06em] text-transparent">
          kescript<span className="text-accent/40">_</span>
        </p>
      </div>
      <p className="sr-only">
        © {new Date().getFullYear()} {SITE.author}
      </p>
    </footer>
  );
}
