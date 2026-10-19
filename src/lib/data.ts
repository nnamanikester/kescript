/**
 * Hand-maintained page data. Posts live in GitHub issues; everything that
 * changes rarely (now, projects, experience, uses) lives here.
 */

/** Bump this whenever you edit NOW. (Carried over from the previous site.) */
export const NOW_UPDATED = "2025-10-01";

export const NOW = {
  building: [
    "AI-powered developer tools at Turing — Slack bots, Chrome extensions, and the Python backends behind them.",
    "RAG pipelines and LLM integrations.",
    "This site, in the open.",
  ],
  learning: ["LangChain, LangGraph, and agentic patterns.", "The Python ML stack — FastAPI, Pydantic.", "Prompt engineering and evaluation."],
  writing: ["Notes on whatever I'm learning — the best way to learn is to explain."],
};

export interface Project {
  slug: string;
  name: string;
  year: string;
  kind: string;
  summary: string;
  problem: string;
  approach: string[];
  stack: string[];
  outcome?: string;
  links?: { label: string; href: string }[];
}

export const PROJECTS: Project[] = [
  {
    slug: "ai-engineering-assistant",
    name: "Engineering assistant for Slack",
    year: "2024–",
    kind: "LLM · internal tool",
    summary: "Ask questions about a large codebase in Slack and get answers grounded in the actual code.",
    problem:
      "Engineers kept asking where something lives, how a feature works, why a decision was made. The answers were in the code, but grep has a ceiling.",
    approach: [
      "Chunked the codebase along function and class boundaries with tree-sitter, falling back to overlapping token windows.",
      "Embedded the chunks for similarity search; each question retrieves the top-k chunks as context.",
      "Answers stream back into the Slack thread.",
    ],
    stack: ["Python", "Slack API", "Embeddings", "RAG"],
    outcome: "Fewer engineering bottlenecks, codebase navigation in plain language, and faster onboarding for new engineers.",
  },
  {
    slug: "report-automation-extension",
    name: "Report-filing browser extension",
    year: "2024",
    kind: "Chrome extension",
    summary: "Kept a revenue-critical workflow alive when the API it depended on was suspended.",
    problem: "Customer report filing ran through an API that was suddenly suspended, and the business couldn't wait for it to return.",
    approach: ["Automated the report-filing process end to end in the browser, without the suspended API."],
    stack: ["JavaScript", "Chrome Extensions", "DOM automation"],
    outcome: "Zero downtime while the API was suspended, and a $1M+ revenue increase within the month.",
  },
  {
    slug: "pickriders",
    name: "Pickriders",
    year: "2023–2024",
    kind: "Mobile platform",
    summary: "A logistics platform: rider and customer apps, admin and business portals, one backend.",
    problem: "Build a delivery platform from scratch that works on the low-end Android phones most riders actually carry.",
    approach: [
      "Rider and customer apps in React Native, optimised for lower-end Android devices.",
      "Led the backend migration from GraphQL to a NestJS REST API for maintainability.",
      "Caching with React Query, a referral rewards system, and push notifications via FCM.",
      "CI/CD across five codebases: customer, rider, admin, business, and backend.",
    ],
    stack: ["React Native", "NestJS", "React Query", "Firebase", "CI/CD"],
  },
  {
    slug: "detox-suite",
    name: "End-to-end test suite for a meditation app",
    year: "2021–2023",
    kind: "Testing infrastructure",
    summary: "Detox tests running on every build, so releases stopped depending on a manual checklist.",
    problem: "Releases depended on long manual QA passes.",
    approach: [
      "Built a comprehensive Detox E2E suite for the app's critical flows.",
      "Integrated it into Bitrise so it runs on every build, with Fastlane for automated builds and deployment.",
    ],
    stack: ["React Native", "Detox", "Bitrise", "Fastlane"],
    outcome: "Manual testing time dropped by more than 70%.",
  },
  {
    slug: "kescript",
    name: "kescript.com",
    year: "2026",
    kind: "Open source",
    summary: "This site. GitHub issues as the CMS and the comment store, rendered with Next.js.",
    problem: "I wanted to write in markdown without a database, a CMS bill, or a third-party comment widget.",
    approach: [
      "Posts are labelled GitHub issues; frontmatter optional.",
      "Comments and reactions are written to the same issue via GitHub's GraphQL API, as the reader.",
      "A unified/shiki pipeline renders everything from footnotes to Mermaid diagrams.",
    ],
    stack: ["Next.js", "TypeScript", "GitHub GraphQL", "Shiki"],
    links: [{ label: "Source", href: "https://github.com/nnamanikester/kescript" }],
  },
];

export const EXPERIENCE = [
  { period: "2024 —", company: "Turing", role: "Full-stack engineer", note: "AI tooling, browser automation, Python services." },
  { period: "2023 — 2024", company: "Pickriders", role: "Senior React Native engineer", note: "Built the mobile platform from zero." },
  { period: "2021 — 2023", company: "Maharishi Foundation International", role: "Senior React Native engineer", note: "Testing, release engineering, timing features." },
  { period: "2020 — 2021", company: "Destreetboard", role: "Senior React Native engineer", note: "Native modules in Swift and Kotlin, animation." },
  { period: "2019 — 2020", company: "Soolerides", role: "React Native engineer", note: "Peer-to-peer calls over WebRTC." },
  { period: "2018 — 2019", company: "iNspark", role: "React Native developer", note: "TypeScript migration, payments." },
];

export const USES = [
  {
    group: "Languages",
    items: [
      { name: "TypeScript", note: "Default for anything that runs in a browser, on a phone, or on Node." },
      { name: "Python", note: "For LLM work and data plumbing." },
      { name: "Swift & Kotlin", note: "When React Native needs a native module." },
    ],
  },
  {
    group: "Mobile",
    items: [
      { name: "React Native + Expo", note: "EAS for builds; Expo Router for navigation." },
      { name: "Reanimated", note: "Animations that stay on the UI thread." },
      { name: "Detox", note: "End-to-end tests that run in CI, not on someone's desk." },
      { name: "Fastlane & Bitrise", note: "Signing and shipping, automated." },
    ],
  },
  {
    group: "Backend & data",
    items: [
      { name: "NestJS / FastAPI", note: "Structured APIs in TypeScript and Python." },
      { name: "PostgreSQL, MongoDB, DynamoDB", note: "Whatever the data actually needs." },
      { name: "GitHub Actions", note: "CI for everything else." },
    ],
  },
  {
    group: "This site",
    items: [
      { name: "Next.js 16 + React 19", note: "Server components; incremental static regeneration." },
      { name: "GitHub Issues", note: "CMS, comment store, and reactions — free and versioned." },
      { name: "unified + Shiki", note: "Markdown to React, with VS Code-grade highlighting." },
      { name: "Tailwind CSS 4", note: "Design tokens in CSS variables; light and dark." },
      { name: "Geist & Geist Mono", note: "Typefaces." },
      { name: "Vercel", note: "Hosting and analytics." },
    ],
  },
];
