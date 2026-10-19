import Link from "next/link";
import { Rss } from "lucide-react";
import { GitHubIcon, LinkedInIcon, XIcon } from "@/components/ui/brand-icons";
import { FOOTER_NAV, GH_REPO_URL, SITE } from "@/lib/site";

/** Build info, shown the way an engineer would want it: which commit is this? */
function buildInfo() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT_SHA;
  return { sha: sha?.slice(0, 7) ?? "dev", built: new Date().toISOString().slice(0, 10) };
}

export function Footer() {
  const { sha, built } = buildInfo();
  return (
    <footer className="mt-32 border-t border-line">
      <div className="mx-auto max-w-5xl px-5 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              Notes to a younger me, on building software. Published in case they help you too.
            </p>
            <div className="mt-5 flex items-center gap-1">
              {[
                { href: SITE.links.github, label: "GitHub", Icon: GitHubIcon },
                { href: SITE.links.twitter, label: "X", Icon: XIcon },
                { href: SITE.links.linkedin, label: "LinkedIn", Icon: LinkedInIcon },
              ].map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer me"
                  aria-label={label}
                  className="grid h-8 w-8 place-items-center rounded-lg text-faint transition-colors hover:bg-hover hover:text-fg"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
              <a href="/rss.xml" aria-label="RSS" className="grid h-8 w-8 place-items-center rounded-lg text-faint transition-colors hover:bg-hover hover:text-fg">
                <Rss className="h-4 w-4" />
              </a>
            </div>
          </div>

          <nav aria-label="Footer" className="contents">
            <ul className="space-y-2 text-sm">
              {FOOTER_NAV.slice(0, 4).map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted transition-colors hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="space-y-2 text-sm">
              {FOOTER_NAV.slice(4).map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted transition-colors hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-dashed border-line pt-5 font-mono text-[0.7rem] text-faint">
          <span>© {new Date().getFullYear()} {SITE.author}</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-ok pulse-dot" aria-hidden />
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
            · <Link href="/colophon" className="hover:text-fg">how this site works</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
