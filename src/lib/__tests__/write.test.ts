import { describe, expect, it } from "vitest";
import { draftFromIssue, issueBody } from "@/lib/write";
import { parseIssue, type GitHubIssue } from "@/lib/content";
import { emptyDraft, validateDraft } from "@/lib/editor/draft";

const issue = (body: string, title = "Hello world"): GitHubIssue => ({
  number: 7,
  title,
  body,
  html_url: "https://github.com/x/y/issues/7",
  created_at: "2026-01-02T00:00:00Z",
  updated_at: "",
  comments: 0,
  user: { login: "nnamanikester" },
  labels: ["published"],
});

describe("writer frontmatter", () => {
  const draft = {
    ...emptyDraft(),
    title: "Hello world",
    subtitle: "Why it matters",
    date: "2026-10-20",
    category: "tutorial" as const,
    tags: ["react-native", "ai"],
    featured: true,
    body: "Some **text**.\n\n```ts\nconst a = 1\n```",
  };

  it("writes an issue the site parses back to the same post", () => {
    const post = parseIssue(issue(issueBody(draft)));
    expect(post).toMatchObject({
      slug: "hello-world",
      title: "Hello world",
      subtitle: "Why it matters",
      date: "2026-10-20",
      category: "tutorial",
      tags: ["react-native", "ai"],
      featured: true,
    });
    expect(post.body).toBe(draft.body);
  });

  it("round-trips through the editor's loader, keeping unknown keys", () => {
    const body = issueBody(draft, { series: "rn-perf" });
    const { draft: back, extra } = draftFromIssue(issue(body));
    expect(back).toEqual({ ...draft, slug: "hello-world" });
    expect(extra).toEqual({ series: "rn-perf" });
  });

  it("pins the slug of a post that never had one, so a new title can't move it", () => {
    const { draft: back } = draftFromIssue(issue("Body only.", "Old title"));
    expect(back.slug).toBe("old-title");
    expect(parseIssue(issue(issueBody({ ...back, title: "New title" }), "New title")).slug).toBe("old-title");
  });

  it("rejects drafts that would publish badly", () => {
    expect(validateDraft({ ...draft, title: " " })).toEqual({ error: "Give the post a title" });
    expect(validateDraft({ ...draft, body: "" })).toEqual({ error: "The post is empty" });
    expect(validateDraft({ ...draft, image: "javascript:alert(1)" })).toHaveProperty("error");
    expect(validateDraft({ ...draft, category: "nope" })).toMatchObject({ draft: { category: "note" } });
  });
});

describe("post status", () => {
  it("is published only with the published label", async () => {
    const { statusOf } = await import("@/lib/write");
    expect(statusOf(issue("x"))).toBe("published");
    expect(statusOf({ ...issue("x"), labels: [{ name: "draft" }, "ai"] })).toBe("draft");
    expect(statusOf({ ...issue("x"), labels: [] })).toBe("draft");
  });

  it("lets drafts be empty but never untitled", () => {
    expect(validateDraft({ ...emptyDraft(), title: "Idea" }, { publishing: false })).toHaveProperty("draft");
    expect(validateDraft({ ...emptyDraft(), title: "" }, { publishing: false })).toEqual({ error: "Give the draft a title first" });
    expect(validateDraft({ ...emptyDraft(), title: "Idea" })).toEqual({ error: "The post is empty" });
  });
});
