import { afterEach, describe, expect, it, vi } from "vitest";
import { deleteDraft, draftFromIssue, issueBody } from "@/lib/write";
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

describe("deleteDraft", () => {
  afterEach(() => vi.unstubAllGlobals());

  /** A fake GitHub: GET returns the issue, GraphQL answers with `graphql`, PATCH echoes. */
  /** A fake GitHub: GraphQL answers with `graphql`; once deleted, the issue 410s; PATCH applies its labels. */
  function github(labels: string[], graphql: { data?: { deleteIssue?: unknown }; errors?: unknown[] }, { keepsLabel = false } = {}) {
    const calls: { method: string; url: string; body?: unknown }[] = [];
    let current = labels;
    let deleted = false;
    vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
      const method = init.method ?? "GET";
      const body = init.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ method, url, body });
      if (url.endsWith("/graphql")) {
        deleted = Boolean(graphql.data?.deleteIssue);
        return Response.json(graphql);
      }
      if (deleted) return Response.json({ message: "This issue was deleted" }, { status: 410 });
      if (method === "PATCH" && !keepsLabel) current = (body as { labels: string[] }).labels;
      return Response.json({ ...issue("Body", "Draft"), node_id: "I_kw7", labels: current });
    });
    return calls;
  }

  it("deletes the issue when GitHub allows it", async () => {
    const calls = github(["draft"], { data: { deleteIssue: { clientMutationId: null } } });
    expect(await deleteDraft("t", 7)).toBe("deleted");
    expect(calls.find((c) => c.url.endsWith("/graphql"))?.body).toMatchObject({ variables: { id: "I_kw7" } });
    expect(calls.some((c) => c.method === "PATCH")).toBe(false);
  });

  it("closes and unlabels it when GitHub won't delete", async () => {
    const calls = github(["draft", "ideas"], { errors: [{ type: "FORBIDDEN", message: "nnamanikester does not have the correct permissions" }] });
    expect(await deleteDraft("t", 7)).toBe("closed");
    expect(calls.find((c) => c.method === "PATCH")?.body).toEqual({ state: "closed", state_reason: "not_planned", labels: ["ideas"] });
  });

  it("doesn't trust a deleteIssue result with nothing in it", async () => {
    const calls = github(["draft"], { data: { deleteIssue: null } });
    expect(await deleteDraft("t", 7)).toBe("closed");
    expect(calls.some((c) => c.method === "PATCH")).toBe(true);
  });

  it("reports a close that kept the draft label", async () => {
    github(["draft"], { errors: [{ message: "nope" }] }, { keepsLabel: true });
    await expect(deleteDraft("t", 7)).rejects.toMatchObject({ status: 502 });
  });

  it("refuses a live post", async () => {
    const calls = github(["published"], {});
    await expect(deleteDraft("t", 7)).rejects.toMatchObject({ status: 409 });
    expect(calls.every((c) => c.method === "GET")).toBe(true);
  });
});
