import { describe, expect, it, vi } from "vitest";
import { RecordingChatModel } from "../rag/__tests__/fake-model";

vi.mock("../content", () => ({
  getPosts: async () => [
    { slug: "flatlist", title: "Why my FlatList was slow", description: "Profiling a list on a cheap Android phone.", tags: ["react-native", "performance"], body: "The FlatList re-rendered every row on Android." },
    { slug: "habits", title: "Habits that stuck", description: "Small routines.", tags: ["life"], body: "Writing before email." },
  ],
  getTags: async () => [
    { tag: "react-native", count: 4 },
    { tag: "life", count: 2 },
  ],
}));

const { editSelection, suggestMeta } = await import("../writer-ai");

function fake(reply: string) {
  const llm = new RecordingChatModel(reply);
  return { llm, sent: () => llm.sent() };
}

const draft = { title: "", subtitle: "", description: "", tags: [], slug: "", body: "My FlatList stuttered on Android until I memoised rows." };

describe("suggestMeta", () => {
  it("grounds a title in related posts", async () => {
    const { llm, sent } = fake('{"title": "\\"Memoising FlatList rows.\\""}');
    expect(await suggestMeta("title", draft, { llm })).toEqual({ title: "Memoising FlatList rows" });
    expect(sent().user).toContain('"Why my FlatList was slow"');
    expect(sent().system).toContain("Under 70 characters");
  });

  it("slugifies tags and shows the existing ones", async () => {
    const { llm, sent } = fake('{"tags": ["React Native", "performance", "react-native"]}');
    expect(await suggestMeta("tags", draft, { llm })).toEqual({ tags: ["react-native", "performance"] });
    expect(sent().user).toContain("react-native (4)");
  });

  it("rejects an answer without the field", async () => {
    const { llm } = fake('{"title": ""}');
    await expect(suggestMeta("title", draft, { llm })).rejects.toThrow(/didn't return a title/);
  });
});

describe("editSelection", () => {
  it("returns the passage without a wrapping fence and offers post links", async () => {
    const { llm, sent } = fake("```markdown\nIt **stuttered**.\n```");
    const out = await editSelection(
      { instruction: "tighten", selection: "It was stuttering quite a lot on Android FlatList", before: "", after: "", title: "", slug: "new-post" },
      { llm },
    );
    expect(out).toBe("It **stuttered**.");
    expect(sent().user).toContain("(/blog/flatlist)");
  });
});
