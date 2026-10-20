# KeScript

[kescript.com](https://kescript.com) — 
Letters to a younger me, sent a month or five years too late.

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
