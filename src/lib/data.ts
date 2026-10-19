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
      "Answers stream back into the Slack thread, so debugging help shows up where the conversation already is.",
    ],
    stack: ["Python", "Slack API", "Embeddings", "RAG"],
    outcome: "Fewer questions queued behind senior engineers, and a faster ramp for people new to the codebase.",
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
    outcome: "Onboarding and retention kept going through the outage; revenue grew by more than $1M that month.",
  },
  {
    slug: "frontend-conventions",
    name: "A frontend people can find their way around",
    year: "2024",
    kind: "Refactor · team",
    summary: "Restructured a growing frontend codebase, then wrote down the why so it would stick.",
    problem: "The codebase had grown faster than its conventions. Finding things took longer than changing them.",
    approach: [
      "Introduced one file structure and naming convention, applied across the codebase.",
      "Documented the decisions, not just the rules, and walked the other frontend engineers through them.",
    ],
    stack: ["React", "TypeScript", "Documentation"],
    outcome: "Code that reads predictably, and features that ship faster because less time goes to searching.",
  },
  {
    slug: "pickriders",
    name: "Pickriders",
    year: "2023–2024",
    kind: "Mobile platform",
    summary: "A logistics platform built from zero: rider and customer apps, admin and business portals, one backend.",
    problem: "Deliveries have to work on the phones riders actually carry — older Android devices on patchy networks — and the money has to add up.",
    approach: [
      "Rider and customer apps in React Native, tuned for lower-end Android, with Reanimated for motion that stays smooth there.",
      "React Query caching so the apps stay usable when the network isn't.",
      "Led the backend move from GraphQL to a NestJS REST API, and worked on the ledger: transactions, fees, discounts and revenue across every flow.",
      "Owned CI/CD for five codebases (customer, rider, admin, business, backend) and ran sprints in GitHub Projects.",
      "Smaller pieces that mattered: referral rewards, scheduling, push notifications over FCM.",
    ],
    stack: ["React Native", "NestJS", "React Query", "Reanimated", "Firebase", "CI/CD"],
  },
  {
    slug: "meditation-app",
    name: "A meditation app, made dependable",
    year: "2021–2023",
    kind: "Mobile · testing · releases",
    summary: "End-to-end tests on every build, sessions that pick up where you left off, and calmer releases.",
    problem: "Releases depended on long manual QA passes, and an interrupted meditation session simply lost its progress.",
    approach: [
      "Wrote a Detox end-to-end suite for the critical flows and ran it in Bitrise on every build, with Fastlane handling builds and delivery.",
      "Made session timing resumable, with completion alerts and scheduled reminders through push notifications.",
      "Fixed critical bugs in the course video player and made course progress save reliably.",
      "Coordinated QA during release cycles, reviewed code, and helped assess candidates during hiring.",
    ],
    stack: ["React Native", "Detox", "Bitrise", "Fastlane", "FCM"],
    outcome: "Manual testing time fell by more than 70%, across several stable releases.",
  },
  {
    slug: "webrtc-calls",
    name: "Private peer-to-peer calls in a mobile app",
    year: "2019–2020",
    kind: "Mobile · real-time",
    summary: "In-app audio and video calls over WebRTC, with the media and signalling encrypted.",
    problem: "Users needed to talk to each other inside the app, with low latency and without the conversation being readable in transit.",
    approach: [
      "Peer-to-peer audio and video over WebRTC, inside React Native.",
      "Encrypted both the media streams and the signalling data.",
      "AWS Cognito for authentication, Redux Toolkit for predictable state, Fastlane for beta builds.",
    ],
    stack: ["React Native", "WebRTC", "AWS Cognito", "Redux Toolkit", "Fastlane"],
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
  {
    period: "2024 —",
    company: "Turing",
    role: "Full-stack engineer",
    note: "AI tooling and the systems around it: a codebase assistant in Slack, browser automation, Python services, API caching, a frontend restructure.",
  },
  {
    period: "2023 — 2024",
    company: "Pickriders",
    role: "Senior React Native engineer",
    note: "Built the rider and customer apps from zero; owned releases for five codebases and worked on the ledger.",
  },
  {
    period: "2021 — 2023",
    company: "Maharishi Foundation International",
    role: "Senior React Native engineer",
    note: "End-to-end tests and release pipelines, resumable meditation sessions, QA coordination, hiring.",
  },
  {
    period: "2020 — 2021",
    company: "Destreetboard",
    role: "Senior React Native engineer",
    note: "Native modules in Swift and Kotlin, motion with Reanimated and Lottie, GraphQL with Apollo, UI test automation.",
  },
  {
    period: "2019 — 2020",
    company: "Soolerides",
    role: "React Native engineer",
    note: "Encrypted peer-to-peer calls over WebRTC; authentication with AWS Cognito.",
  },
  {
    period: "2018 — 2019",
    company: "iNspark",
    role: "React Native developer",
    note: "Payment flows, a TypeScript migration, CI pipelines, and profiling performance with Sentry.",
  },
];

export const USES = [
  {
    group: "Languages",
    items: [
      { name: "TypeScript", note: "The default — browser, phone, or Node. I've migrated a JavaScript codebase to it and wouldn't go back." },
      { name: "Python", note: "Backend services with FastAPI, and most of my LLM work." },
      { name: "Swift, Kotlin & Java", note: "For the native modules React Native can't give you." },
    ],
  },
  {
    group: "Mobile",
    items: [
      { name: "React Native + Expo", note: "Six-plus years, five-plus apps through the App Store and Play Store. EAS for builds." },
      { name: "React Navigation & Expo Router", note: "Navigation, depending on the project's age." },
      { name: "React Query, Redux Toolkit, Apollo", note: "Server state, client state, and GraphQL. React Query is the quickest way I know to make an app survive a bad network." },
      { name: "Reanimated & Lottie", note: "Motion that stays smooth on cheap Android phones." },
      { name: "Firebase Cloud Messaging", note: "Push notifications, reminders, real-time nudges." },
    ],
  },
  {
    group: "Testing, release & observability",
    items: [
      { name: "Detox & Jest", note: "End-to-end and unit tests that run on every build, not just before a release." },
      { name: "Fastlane, Bitrise, EAS", note: "Signing, building and shipping without anyone clicking through a console." },
      { name: "GitHub Actions & CircleCI", note: "CI for everything else." },
      { name: "Sentry", note: "Where performance problems and crashes go to be found." },
    ],
  },
  {
    group: "Web, backend & cloud",
    items: [
      { name: "Next.js & React", note: "The web side, including this site. Electron when it needs to be a desktop app." },
      { name: "NestJS & Node", note: "Structured APIs in TypeScript." },
      { name: "GraphQL & REST", note: "Both, and I've migrated from one to the other." },
      { name: "PostgreSQL, MySQL, MongoDB", note: "Relational by default; documents when the shape really is a document." },
      { name: "AWS — Cognito, S3, DynamoDB", note: "Auth, storage, and a database that scales without a DBA." },
      { name: "Cloudinary", note: "Images and media, transformed on the fly." },
    ],
  },
  {
    group: "Planning",
    items: [{ name: "GitHub Projects, Milestones & Issues", note: "Sprint planning where the code already lives. Also, it turns out, a decent CMS." }],
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
