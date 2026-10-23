import { describe, expect, it, vi } from "vitest";
import type { GoogleGenAI } from "@google/genai";
import { ChatAnthropic } from "@langchain/anthropic";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { GeminiChatModel, KeywordSearch, LLMError, RAGBase, createChatModel, keywords, parseJSON, unfence, type Passage } from "..";
import { RecordingChatModel } from "./fake-model";

const posts = [
  { text: "Profiling React Native on low-end Android.\n\nThe JS thread was blocked by a huge FlatList render.", meta: { id: "rn-perf" } },
  { text: "Morning habits that stuck.\n\nWriting before email changed how my days went.", meta: { id: "habits" } },
  { text: "Retrieval for a Slack assistant.\n\nChunking, BM25 and embeddings over a codebase.", meta: { id: "rag" } },
];
type Meta = { id: string };

describe("KeywordSearch", () => {
  it("splits markdown into cleaned passages that remember their source", async () => {
    const text = Array.from({ length: 6 }, (_, i) => `## Part ${i}\n\n**Bold** ${"word ".repeat(30)}`).join("\n\n");
    const search = await KeywordSearch.fromMarkdown([{ text, meta: { id: "d" } }], {
      chunkSize: 250,
      chunkOverlap: 0,
      clean: (t) => t.replace(/\*\*/g, ""),
    });
    const found = await search.find("bold word part");
    expect(found.length).toBeGreaterThan(1);
    expect(found.every((p) => p.text.length <= 250 && !p.text.includes("**") && p.meta.id === "d")).toBe(true);
  });

  it("ranks the matching passage first, ignoring case", async () => {
    const [top] = await new KeywordSearch(posts).find("why is my flatlist slow on android");
    expect(top.meta.id).toBe("rn-perf");
    expect(top.text).toContain("FlatList");
    expect(top.score).toBeGreaterThan(0);
  });

  it("finds nothing for unrelated or stopword-only queries, or with no texts", async () => {
    const search = new KeywordSearch(posts);
    expect(await search.find("zebra quantum")).toEqual([]);
    expect(await search.find("the and with")).toEqual([]);
    expect(await new KeywordSearch([]).find("flatlist")).toEqual([]);
    expect(keywords("The FlatList, the flatlist and a JS thread")).toEqual(["flatlist", "thread"]);
  });
});

/** The smallest RAGBase task: title a post about a topic, using related posts. */
class TopicTitler extends RAGBase<{ topic: string }, { title: string }, Meta> {
  protected instructions(input: { topic: string }) {
    return `Title a post about ${input.topic}. Keep {curly} text literal.`;
  }
  protected searchQuery(input: { topic: string }) {
    return input.topic;
  }
  protected pickSources(found: Passage<Meta>[]) {
    return found.filter((p) => p.meta.id !== "habits").slice(0, 1);
  }
  protected prompt(input: { topic: string }, sources: Passage<Meta>[]) {
    return `CONTEXT:\n${sources.map((s) => s.text).join("\n")}\n\nTOPIC: ${input.topic}`;
  }
  protected parse(reply: string) {
    return parseJSON<{ title: string }>(reply);
  }
}

/** A task with a rule: answer in one word. No search. */
class OneWord extends RAGBase<string, string> {
  constructor(llm: RecordingChatModel, attempts?: number) {
    super(llm);
    if (attempts) this.maxAttempts = attempts;
  }
  protected instructions() {
    return "Reply with one word.";
  }
  protected prompt(input: string) {
    return input;
  }
  protected parse(reply: string) {
    return reply.trim();
  }
  protected findProblem(output: string) {
    return output.includes(" ") ? "Use exactly one word." : null;
  }
}

describe("RAGBase", () => {
  it("searches, asks the model with the passages, and parses the reply", async () => {
    const llm = new RecordingChatModel('Sure! {"title": "Hello {braces} ok"}');
    const { output, sources } = await new TopicTitler(llm, new KeywordSearch(posts)).run({ topic: "chunking embeddings" });
    expect(output).toEqual({ title: "Hello {braces} ok" });
    expect(sources.map((s) => s.meta.id)).toEqual(["rag"]);
    expect(llm.sent().system).toBe("Title a post about chunking embeddings. Keep {curly} text literal.");
    expect(llm.sent().user).toContain("Chunking, BM25");
  });

  it("lets pickSources drop passages, and works without a search", async () => {
    const llm = new RecordingChatModel('{"title": "x"}');
    expect((await new TopicTitler(llm, new KeywordSearch(posts)).run({ topic: "habits email" })).sources).toEqual([]);
    const { sources } = await new TopicTitler(llm).run({ topic: "chunking" });
    expect(sources).toEqual([]);
  });

  it("sends a reply that breaks a rule back with the reason, then accepts the fix", async () => {
    const llm = new RecordingChatModel(["two words", "one"]);
    expect(await new OneWord(llm).run("go")).toMatchObject({ output: "one", attempts: 2, problem: null });
    const retry = llm.calls[1];
    expect(retry.map((m) => m.type)).toEqual(["system", "human", "ai", "human"]);
    expect(retry[2].text).toBe("two words");
    expect(retry[3].text).toContain("Use exactly one word.");
  });

  it("stops after maxAttempts and reports what's still wrong", async () => {
    const llm = new RecordingChatModel(["still two", "and again", "never"]);
    expect(await new OneWord(llm, 2).run("go")).toMatchObject({ output: "and again", attempts: 2, problem: "Use exactly one word." });
    expect(llm.calls).toHaveLength(2);
  });

  it("asks once when the first reply passes", async () => {
    const llm = new RecordingChatModel("fine");
    expect(await new OneWord(llm).run("go")).toMatchObject({ output: "fine", attempts: 1 });
  });
});

describe("helpers", () => {
  it("parseJSON finds JSON in prose and fences", () => {
    expect(parseJSON('Here:\n```json\n{"a": [1]}\n```')).toEqual({ a: [1] });
    expect(parseJSON('ok ["x","y"] done')).toEqual(["x", "y"]);
    expect(() => parseJSON("nothing")).toThrow();
  });

  it("unfence strips one wrapping fence", () => {
    expect(unfence("```markdown\nHello *there*\n```")).toBe("Hello *there*");
    expect(unfence("Plain `code` text")).toBe("Plain `code` text");
  });
});

describe("createChatModel", () => {
  it("picks a provider", () => {
    expect(createChatModel({})).toBeNull();
    const anthropic = createChatModel({ ANTHROPIC_API_KEY: "k" });
    expect(anthropic).toBeInstanceOf(ChatAnthropic);
    expect((anthropic as ChatAnthropic).model).toBe("claude-sonnet-5-5");
    expect(createChatModel({ GEMINI_API_KEY: "g" })).toBeInstanceOf(GeminiChatModel);
    expect((createChatModel({ GOOGLE_API_KEY: "g", AI_MODEL: "gemini-4-argon" }) as GeminiChatModel).model).toBe("gemini-4-argon");
    expect(createChatModel({ ANTHROPIC_API_KEY: "a", GEMINI_API_KEY: "g", AI_PROVIDER: "gemini" })).toBeInstanceOf(GeminiChatModel);
    expect(createChatModel({ AI_PROVIDER: "gemini", ANTHROPIC_API_KEY: "a" })).toBeNull();
    expect(createChatModel({ OPENAI_API_KEY: "k" })).toBeNull();
    const openai = createChatModel({ AI_BASE_URL: "http://localhost:11434/v1", AI_MODEL: "llama3" }) as ChatOpenAI;
    expect(openai).toBeInstanceOf(ChatOpenAI);
    expect(openai.useResponsesApi).toBe(true);
  });
});

describe("GeminiChatModel", () => {
  const fakeClient = (create: (...args: unknown[]) => Promise<unknown>) => ({ interactions: { create } }) as unknown as GoogleGenAI;

  it("calls the Interactions API and skips thought steps", async () => {
    const create = vi.fn<(params: unknown, opts?: unknown) => Promise<unknown>>(async () => ({
      id: "i1",
      status: "completed",
      steps: [
        { type: "thought", summary: [{ type: "text", text: "thinking…" }] },
        { type: "model_output", content: [{ type: "text", text: "Hel" }, { type: "text", text: "lo" }] },
      ],
    }));
    const model = new GeminiChatModel({ client: fakeClient(create), maxTokens: 100 });
    const out = await model.invoke([new SystemMessage("s"), new HumanMessage("u1"), new AIMessage("a1"), new HumanMessage("u2")]);
    expect(out.text).toBe("Hello");
    expect(create.mock.calls[0][0]).toEqual({
      model: "gemini-3.8-flash",
      system_instruction: "s",
      input: [
        { type: "user_input", content: [{ type: "text", text: "u1" }] },
        { type: "model_output", content: [{ type: "text", text: "a1" }] },
        { type: "user_input", content: [{ type: "text", text: "u2" }] },
      ],
      generation_config: { max_output_tokens: 2148, thinking_level: "low" },
      store: false,
    });
  });

  it("turns off the SDK's silent retries and passes a cancel signal", async () => {
    const create = vi.fn<(params: unknown, opts?: unknown) => Promise<unknown>>(async () => ({ status: "completed", steps: [], output_text: "ok" }));
    await new GeminiChatModel({ client: fakeClient(create) }).invoke("hi");
    const opts = create.mock.calls[0][1] as { retries: unknown; fetch_options: { signal: AbortSignal } };
    expect(opts.retries).toEqual({ strategy: "none" });
    expect(opts.fetch_options.signal).toBeInstanceOf(AbortSignal);
  });

  it("retries a 503 through LangChain, then reports it", async () => {
    const overloaded = Object.assign(new Error("API error occurred"), { statusCode: 503, body: '{"error":{"message":"The model is overloaded."}}' });
    const create = vi.fn(async () => Promise.reject(overloaded));
    const model = new GeminiChatModel({ client: fakeClient(create), maxRetries: 1 });
    await expect(model.invoke("hi")).rejects.toMatchObject({ status: 503, message: "gemini 503: The model is overloaded." });
    expect(create).toHaveBeenCalledTimes(2);
  }, 15_000);

  it("gives up after the timeout without retrying", async () => {
    const create = vi.fn(
      (_p: unknown, opts?: unknown) =>
        new Promise((_, reject) => {
          const { signal } = (opts as { fetch_options: { signal: AbortSignal } }).fetch_options;
          signal.addEventListener("abort", () => reject(signal.reason));
        }),
    );
    const model = new GeminiChatModel({ client: fakeClient(create), timeoutMs: 50, maxRetries: 2 });
    await expect(model.invoke("hi")).rejects.toMatchObject({ status: 504, message: "gemini: no answer after 0s" });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("reports interactions without an answer, and maps SDK errors", async () => {
    const run = (result: () => Promise<unknown>) => new GeminiChatModel({ client: fakeClient(result), maxRetries: 0 }).invoke("hi");
    await expect(run(async () => ({ status: "incomplete", steps: [] }))).rejects.toThrow("gemini: no answer (incomplete)");
    await expect(run(async () => ({ status: "failed", steps: [], errors: [{ message: "blocked for safety" }] }))).rejects.toThrow("blocked for safety");
    expect((await run(async () => ({ status: "completed", steps: [], output_text: "fallback" }))).text).toBe("fallback");

    const sdkError = Object.assign(new Error("API error occurred"), { statusCode: 400, body: '{"error":{"message":"API key not valid"}}' });
    const failing = run(async () => Promise.reject(sdkError));
    await expect(failing).rejects.toBeInstanceOf(LLMError);
    await expect(failing).rejects.toThrow("gemini 400: API key not valid");
  });
});
