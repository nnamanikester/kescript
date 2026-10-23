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

const { descriptionProblem, editSelection, suggestMeta } = await import("../writer-ai");

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

  it("builds the description from the post's favourite part, fitted for search", async () => {
    const description = "My FlatList stuttered on Android until I memoised the rows. Fix FlatList performance there first, before you swap list libraries.";
    const { llm, sent } = fake(JSON.stringify({ favorite: "until I memoised rows", keyword: "FlatList performance", description }));
    expect(await suggestMeta("description", draft, { llm })).toEqual({ description, favorite: "until I memoised rows", quoted: true, keyword: "flatlist performance" });
    expect(sent().system).toContain("Step 1, the favourite part");
    expect(sent().system).toContain("no double quotes");
    expect(sent().user).toContain("Voice sample: Why my FlatList was slow");
  });

  it("sends a description that breaks a search rule back to the model", async () => {
    const good = "My FlatList stuttered on Android until I memoised the rows. Fix FlatList performance there first, before you swap list libraries.";
    const llm = new RecordingChatModel([
      JSON.stringify({ favorite: "A line I made up", keyword: "flatlist performance", description: "Too short." }),
      JSON.stringify({ favorite: "A line I made up", keyword: "flatlist performance", description: good }),
    ]);
    const out = await suggestMeta("description", draft, { llm });
    expect(out).toMatchObject({ description: good, quoted: false });
    expect(llm.calls).toHaveLength(2);
    expect(llm.calls[1].at(-1)?.text).toContain("The description is 10 characters; it must be 120 to 155.");
  });

  it("checks description rules", () => {
    const ok = "x".repeat(70) + " flatlist performance " + "y".repeat(40);
    expect(descriptionProblem({ description: ok, keyword: "flatlist performance" })).toBeNull();
    expect(descriptionProblem({ description: "short" })).toMatch(/120 to 155/);
    expect(descriptionProblem({ description: `${ok.slice(0, 120)} "quoted"` })).toMatch(/double quotes/);
    expect(descriptionProblem({ description: "z".repeat(130), keyword: "flatlist performance" })).toMatch(/search phrase/);
  });

  it("keeps the ending of a long post, where the conclusion is", async () => {
    const { llm, sent } = fake(JSON.stringify({ description: "d".repeat(130) }));
    const body = `Opening line.\n\n${"Middle filler. ".repeat(3000)}\n\nIn the end: memoise rows.`;
    await suggestMeta("description", { ...draft, body }, { llm });
    expect(sent().user).toContain("Opening line.");
    expect(sent().user).toContain("In the end: memoise rows.");
    expect(sent().user).toContain("[…middle of the post omitted…]");
  });

  it("accepts tags given as one comma-separated string", async () => {
    const { llm } = fake('{"tags": "react-native, Performance"}');
    expect(await suggestMeta("tags", draft, { llm })).toEqual({ tags: ["react-native", "performance"] });
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
