import { describe, it, expect } from "vitest";
import { parseIssue, parseNextLink, toPlainText, type GitHubIssue } from "../content";
import { formatDate, relativeTime, slugify } from "../utils";

const issue = (over: Partial<GitHubIssue> = {}): GitHubIssue => ({
  number: 7,
  title: "Hello World: A Test",
  body: "This is the first paragraph, and it is comfortably longer than forty characters.\n\n## Heading\n\nMore.",
  html_url: "https://github.com/o/r/issues/7",
  created_at: "2025-06-01T10:00:00Z",
  updated_at: "2025-06-02T10:00:00Z",
  comments: 3,
  user: { login: "nnamanikester" },
  labels: [{ name: "published" }, { name: "featured" }, { name: "React Native" }],
  reactions: { total_count: 5 },
  ...over,
});

describe("parseIssue", () => {
  it("derives everything from the issue when there is no frontmatter", () => {
    const p = parseIssue(issue());
    expect(p.slug).toBe("hello-world-a-test");
    expect(p.date).toBe("2025-06-01");
    expect(p.tags).toEqual(["react-native"]);
    expect(p.featured).toBe(true);
    expect(p.category).toBe("note");
    expect(p.description).toMatch(/^This is the first paragraph/);
    expect(p.commentCount).toBe(3);
    expect(p.reactionCount).toBe(5);
  });

  it("lets frontmatter override the issue", () => {
    const p = parseIssue(
      issue({
        body: "---\ntitle: Custom\nslug: my-slug\ndate: 2024-01-15\ncategory: Essay\ntags: [AI, rag]\ndescription: Short.\ncanonical: https://x.dev/p\n---\n\nBody text here.",
      }),
    );
    expect(p).toMatchObject({
      title: "Custom",
      slug: "my-slug",
      date: "2024-01-15",
      category: "essay",
      tags: ["ai", "rag"],
      description: "Short.",
      canonical: "https://x.dev/p",
    });
    expect(p.body).toBe("Body text here.");
  });

  it("falls back to 'note' for unknown categories", () => {
    expect(parseIssue(issue({ body: "---\ncategory: rant\n---\nx" })).category).toBe("note");
  });
});

describe("helpers", () => {
  it("parses the GitHub Link header", () => {
    expect(parseNextLink('<https://api.github.com/x?page=2>; rel="next", <https://api.github.com/x?page=5>; rel="last"')).toBe(
      "https://api.github.com/x?page=2",
    );
    expect(parseNextLink(null)).toBeNull();
  });

  it("strips markdown to plain text", () => {
    expect(toPlainText("## Title\n\n**Bold** [link](http://x) `code`\n\n```js\nhidden\n```")).toBe("Title Bold link code");
  });

  it("slugifies like swyxkit", () => {
    expect(slugify("Hello, World! — 2025")).toBe("hello-world-2025");
  });

  it("formats dates without timezone drift", () => {
    expect(formatDate("2025-03-05")).toBe("Mar 5, 2025");
    expect(formatDate("2025-12-31T23:59:59Z")).toBe("Dec 31, 2025");
  });

  it("formats relative times", () => {
    const now = Date.parse("2025-06-10T00:00:00Z");
    expect(relativeTime("2025-06-09T00:00:00Z", now)).toBe("1 day ago");
    expect(relativeTime("2025-06-09T23:59:50Z", now)).toBe("just now");
  });
});
