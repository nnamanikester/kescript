/**
 * Single source of truth for personalisation — the swyxkit `siteConfig.js`.
 * Everything that identifies the author or the content repo lives here.
 */
export const SITE = {
  /** The name. Handles, usernames and the domain stay lowercase "kescript". */
  name: "KeScript",
  author: "John Nnamani",
  handle: "kescript",
  title: "KeScript — John Nnamani",
  tagline: "Notes to a younger me, on building software.",
  description:
    "Letters to a younger me, sent a month or five years too late. John Nnamani on building things — software, habits and life — so you only learn them once.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://kescript.com").replace(/\/$/, ""),
  email: "nnamanikester@gmail.com",
  location: "Lisbon, Portugal",
  links: {
    github: "https://github.com/nnamanikester",
    twitter: "https://x.com/kescript",
    linkedin: "https://www.linkedin.com/in/nnamanikester",
  },
  twitterHandle: "@kescript",
  /** Buttondown username. Leave empty to show RSS-only subscribe options. */
  buttondown: process.env.NEXT_PUBLIC_BUTTONDOWN_USERNAME ?? "",
} as const;

/** The GitHub repo whose issues are the CMS and the comment store. */
export const GH = {
  owner: "nnamanikester",
  repo: "kescript",
  /** Issues with any of these labels are published. */
  publishedLabels: ["published"],
  /** Only issues opened by these users become posts — anyone can open issues. */
  approvedPosters: ["nnamanikester"],
} as const;

export const GH_REPO_URL = `https://github.com/${GH.owner}/${GH.repo}`;

/** Categories (swyxkit "singletons"). Unknown/absent category => "note". */
export const CATEGORIES = ["essay", "tutorial", "note", "snippet"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  essay: "Essays",
  tutorial: "Tutorials",
  note: "Notes",
  snippet: "Snippets",
};

export const NAV = [
  { href: "/blog", label: "Writing" },
  { href: "/projects", label: "Projects" },
  { href: "/now", label: "Now" },
  { href: "/about", label: "About" },
] as const;

export const FOOTER_NAV = [
  { href: "/blog", label: "Writing" },
  { href: "/tags", label: "Topics" },
  { href: "/projects", label: "Projects" },
  { href: "/now", label: "Now" },
  { href: "/uses", label: "Uses" },
  { href: "/about", label: "About" },
  { href: "/colophon", label: "Colophon" },
  { href: "/subscribe", label: "Subscribe" },
] as const;
