# KeScript

[kescript.com](https://kescript.com) — 
Notes to a younger me, on building software.

A Next.js 16 port of [swyxkit](https://github.com/swyxio/swyxkit): **GitHub issues are the CMS, the comment store, and the reactions** — no database, no CMS bill, no third-party comment widget.

```sh
cp .env.example .env.local   # fill in GITHUB_TOKEN at minimum
npm install
npm run dev                  # http://localhost:3000
npm test                     # vitest
```

---

## Publishing a post

1. Open a new issue in [nnamanikester/kescript](https://github.com/nnamanikester/kescript/issues/new).
2. **Title** → post title. **Body** → the post, in markdown.
3. Add the **`published`** label. That's it.

The site picks it up within 5 minutes, or within seconds once the webhook is set up (below). To unpublish, remove the label. To edit, edit the issue.

Extra labels become tags (`react-native`, `ai`, …). Add a **`featured`** label to put a post on the home page's *Start here*.

### Optional frontmatter

Put this at the very top of the issue body to override anything:

```yaml
---
title: How I built an AI Slack assistant
subtitle: Retrieval, chunking, and not hallucinating
description: Shown in lists, search results and social cards.
slug: ai-slack-assistant # default: slugified title — don't change after publishing
date: 2025-03-05 # default: when the issue was opened
updated: 2025-04-01
category: essay # essay | tutorial | note | snippet (default: note)
tags: [ai, rag, python] # default: the issue's labels
image: https://…/cover.png # default: generated OG card
canonical: https://… # if it was published elsewhere first
featured: true
---
```

### What markdown can do

Everything GitHub renders, plus more. Open **`/styleguide`** on the running site next to [`content/styleguide.md`](content/styleguide.md) to see the source and the result side by side. Highlights:

| You write | You get |
| --- | --- |
| ` ```ts title="app.ts" showLineNumbers {2-4} ` | Filename header, line numbers, highlighted lines, copy & wrap buttons |
| `// [!code ++]` `// [!code --]` `// [!code focus]` `// [!code error]` | Diff, focus, and error lines (comment is removed) |
| ` ```py /chunk/ ` | Every `chunk` highlighted |
| `:::code-group` … `:::` around several fences | Tabs; the reader's choice is remembered site-wide |
| ` ```sh npm2yarn ` | Automatic npm / pnpm / yarn / bun tabs |
| `> [!NOTE]` `[!TIP]` `[!IMPORTANT]` `[!WARNING]` `[!CAUTION]` | Callouts |
| `$E=mc^2$`, `$$…$$` | KaTeX maths |
| ` ```mermaid ` | Diagrams that follow light/dark theme |
| A YouTube or X link alone on a line, or `{% youtube ID %}` / `{% tweet ID %}` | Embeds |
| `![alt](src "Caption")` | Figure with caption, click to zoom |
| `[^1]` | Footnotes |
| `<details>`, `<kbd>`, any HTML | Rendered as-is (posts only — comments are sanitised) |
| `## Table of contents` heading | Auto-filled with links to the sections |

Drag images into the GitHub issue editor to upload them — GitHub hosts them for free.

---

## Writing from the site

Go to **`/write`** (or click the pen in the header — only you see it). The editor *is* the post: same typography, code blocks, callouts and layout as the published page, but everything is editable.

- **Title, subtitle, category, date and tags** are edited in place in the post header.
- **`/`** opens the block menu: headings, lists, checklists, quotes, images, YouTube, posts on X, code (with a language picker and filename), code tabs, install commands (npm/pnpm/yarn/bun), Mermaid diagrams (previewed live), the five callouts, tables, equations, footnotes, collapsible sections, and raw Markdown/HTML.
- **Select text** for bold, italic, strike, code, link and headings. Shortcuts: ⌘B, ⌘I, ⌘E, ⌘K (link), ⌘Z. Markdown shortcuts work too: `## `, `- `, `1. `, `> `, ` ``` `, `---`, `$x^2$`.
- **Paste** Markdown from anywhere and it becomes blocks. Paste a YouTube or X link on an empty line and it becomes an embed. Paste or drop images to upload them.
- **Preview** renders the draft with the real post pipeline (Shiki, KaTeX, embeds).
- **Settings** (the sliders icon) holds what readers don't see: URL, SEO description, social image, featured, last-updated date and canonical URL.
- **Drafts autosave to GitHub** as an issue labelled `draft` (the site never shows it), as soon as the post has a title. Saves happen after a 4-second pause in typing, at most once every 15 seconds, and at least every 30 seconds while you type non-stop. That stays well inside GitHub's write limits and keeps the issue's edit history readable. ⌘S saves immediately. If GitHub can't be reached, the draft is kept in this browser and retried. The repo is public, so drafts are readable on GitHub. **`/write/drafts`** lists every `draft` issue and every published post.
- **Live posts never autosave.** Edits stay on your screen (and in this browser) until you press **Update**, so half-finished changes never reach readers.
- **Unpublish** (in Settings, on a live post) takes it off the site and turns it back into a draft. The issue, comments and reactions are kept.
- **Delete a draft** from Settings, or with the trash icon on `/write/drafts`. The issue is deleted from GitHub for good. If your sign-in isn't allowed to delete issues (that needs repo admin), it's closed and its `draft` label removed instead, which takes it off your drafts. Live posts can't be deleted: unpublish first.
- **Sign in / out** from the header. Readers use it to comment and react; you also get *Write a post* and *Drafts & posts* in its menu.

**Publish** opens a new issue *as you* (or relabels the draft's issue) with `published`, with the frontmatter written for you, and refreshes the site immediately. On an existing post, the pen becomes **edit** next to the date. **Update** edits the same issue, and the URL is pinned so changing the title never breaks links. Anything you edit directly on GitHub still works; the editor reads it back.

**Images** go to an `assets` branch of this repo (created on first upload, with deployments switched off for it) and are served from `raw.githubusercontent.com`. That needs **`GITHUB_TOKEN` with *Contents: Read and write*** on this repo: a fine-grained token with *Contents: Read and write* and *Issues: Read-only* is enough. The GitHub App deliberately doesn't get Contents access, so commenters are never asked to grant write access to code.

**AI assists** appear once an AI key is set: `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` (from [Google AI Studio](https://aistudio.google.com/apikey)), or `OPENAI_API_KEY`/`AI_BASE_URL` plus `AI_MODEL` for OpenAI or any server with a Responses API, including a local Ollama. `AI_MODEL` overrides the default model, and `AI_PROVIDER` picks one when several keys are set. The **wand** next to the title, the tags and the SEO description (in Settings) fills that field from the post. Click again for a different suggestion. **Select text → Ask AI** opens a prompt: type what you want ("make this friendlier", "turn into a list") or pick a quick action, then **Replace** (⌘↵), **Insert below**, **Try again**, or type a follow-up to refine the answer. ⌘Z undoes an applied change. Each request retrieves related passages from your published posts, so suggestions reuse your tags, match your titles, and can link to your other posts.

It's built on **LangChain** and **LangGraph**, in two folders:

- **`src/lib/rag`**, the general toolkit:
  - **`KeywordSearch`** splits markdown into passages (LangChain's `MarkdownTextSplitter`) and ranks them for a query with BM25. No vector database or embeddings.
  - **`RAGBase`** is an abstract class for one task: search for passages, ask the model, then read and check its reply. A reply that breaks a rule goes back to the model with the reason. The steps run as a small LangGraph graph.
  - **`createChatModel()`** returns `ChatAnthropic`, `ChatOpenAI` (Responses API) or `GeminiChatModel` (Gemini's Interactions API), depending on the env vars above.
- **`src/lib/writer-ai`**, the writer's tasks: `TitleWriter`, `TagPicker`, `DescriptionWriter` and `SelectionEditor`. Each extends `BlogTask`, a `RAGBase` that searches your other published posts.

A task is a subclass that fills in a few methods:

```ts
class Summariser extends RAGBase<{ text: string }, string> {
  protected instructions() { return "Summarise in the author's voice."; }          // system prompt
  protected searchQuery(input) { return input.text; }                              // optional: what to look up
  protected prompt(input, sources) { return `${sources.map((s) => s.text).join("\n")}\n\n${input.text}`; }
  protected parse(reply) { return reply.trim(); }                                  // reply → output
  protected findProblem(output) { return output.length > 300 ? "Keep it under 300 characters." : null; } // optional rule
}

const search = await KeywordSearch.fromMarkdown(posts.map((p) => ({ text: p.body, meta: { slug: p.slug } })));
const { output, sources } = await new Summariser(createChatModel()!, search).run({ text });
```

Requires the GitHub App below. You must be signed in as an `approvedPosters` account (`src/lib/site.ts`). Everyone else gets a 404.

## Turn on native comments (one-time, ~5 minutes)

Readers sign in with GitHub in a popup, then comment, edit, delete and react **as themselves** without leaving the page. Until this is configured, the comment box links to the GitHub issue instead.

1. **Create a GitHub App** at *GitHub → Settings → Developer settings → GitHub Apps → New*.
   - **Homepage URL:** `https://kescript.com`
   - **Callback URL:** `https://kescript.com/api/auth/callback`. Add `http://localhost:3000/api/auth/callback` as a second one for local dev.
   - **Webhook:** uncheck *Active*. This app doesn't need one.
   - **Repository permissions → Issues:** *Read and write*. Leave everything else at *No access*.
   - **Where can this app be installed:** *Only on this account*
2. **Generate a client secret** on the app page.
3. **Install the app** (left sidebar → *Install App*) on **only** the `kescript` repository.
4. Set the env vars (locally in `.env.local`, and in Vercel → Settings → Environment Variables):
   ```sh
   GITHUB_CLIENT_ID=Iv23…
   GITHUB_CLIENT_SECRET=…
   AUTH_SECRET=$(openssl rand -base64 32)
   ```

Why a GitHub App rather than an OAuth App: readers grant it access to issues **in this one repo only**. An OAuth App would need the `public_repo` scope, which covers every public repo they own, and that's a lot to ask for a comment box.

Tokens are kept in an AES-GCM-encrypted, httpOnly cookie, so there's no session database. Writes are same-origin only, and comment HTML is sanitised before it's highlighted.

## Instant publishing (optional)

*Repo → Settings → Webhooks → Add webhook*
- **Payload URL:** `https://kescript.com/api/revalidate`
- **Content type:** `application/json`
- **Secret:** any random string, also set as `GITHUB_WEBHOOK_SECRET`
- **Events:** *Issues*, *Issue comments*, *Labels*

## Newsletter (optional)

Create a free [Buttondown](https://buttondown.com) account and set `NEXT_PUBLIC_BUTTONDOWN_USERNAME`. Until then, readers get RSS, JSON Feed, and "watch on GitHub".

---

## Where things live

```
content/styleguide.md        every markdown feature, rendered at /styleguide
content/blog/*.mdx           fallback posts, used only when GitHub is unreachable
src/lib/site.ts              name, links, repo, labels, categories, nav  ← start here
src/lib/data.ts              /now, /projects, /about timeline, /uses  ← edit by hand
src/lib/content.ts           GitHub issues → posts
src/lib/github.ts            GraphQL thread: comments, reactions, mutations
src/lib/markdown/            unified pipeline + plugins (tested)
src/components/discussion/   comment thread, editor, reactions, popup sign-in
src/components/post/         code blocks, tabs, mermaid, embeds, TOC
src/app/api/                 auth, thread, preview, posts JSON, OG images, webhook
```

| Route | |
| --- | --- |
| `/` `/blog` `/blog/[slug]` `/tags` `/tags/[tag]` | Writing |
| `/about` `/now` `/projects` `/uses` `/colophon` `/subscribe` `/styleguide` | Pages |
| `/rss.xml` `/feed.json` `/sitemap.xml` | Feeds (full content) |
| `/api/posts` `/api/posts/[slug]` | JSON (swyxkit's `listContent.json`) |

Keyboard: <kbd>⌘K</kbd> command palette everywhere, <kbd>/</kbd> to search on `/blog`, <kbd>⌘↵</kbd> to post a comment.
