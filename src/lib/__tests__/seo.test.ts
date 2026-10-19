import { describe, it, expect } from "vitest";
import { pageMetadata, tagLabel } from "../seo";

describe("tagLabel", () => {
  it("formats acronyms, brands and words", () => {
    expect(tagLabel("rag")).toBe("RAG");
    expect(tagLabel("slack-api")).toBe("Slack API");
    expect(tagLabel("typescript")).toBe("TypeScript");
    expect(tagLabel("react-native")).toBe("React Native");
    expect(tagLabel("ai-engineering")).toBe("AI Engineering");
    expect(tagLabel("best-practices")).toBe("Best Practices");
  });
});

describe("pageMetadata", () => {
  it("always sets the page's own canonical, social url, title and image", () => {
    const m = pageMetadata({ title: "About", path: "/about", description: "d", socialTitle: "About John" });
    expect(m.alternates?.canonical).toBe("/about");
    expect(m.openGraph?.url).toBe("/about");
    expect(m.openGraph?.title).toBe("About John");
    expect(JSON.stringify(m.openGraph?.images)).toContain("/api/og?title=About+John");
    expect(m.robots).toBeUndefined();
  });

  it("marks pages noindex but still followable", () => {
    expect(pageMetadata({ title: "x", path: "/x", description: "d", noindex: true }).robots).toEqual({ index: false, follow: true });
  });
});
