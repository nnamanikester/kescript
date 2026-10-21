import { describe, expect, it, vi } from "vitest";
import type { GoogleGenAI } from "@google/genai";
import { ChatAnthropic } from "@langchain/anthropic";
import { Document } from "@langchain/core/documents";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGeminiInteractions, KeywordRetriever, LLMError, RAGBase, chatModelFromEnv, parseJSON, splitMarkdown, unfence } from "..";
import { RecordingChatModel } from "./fake-model";

const docs = [
  new Document({ pageContent: "Profiling React Native on low-end Android.\n\nThe JS thread was blocked by a huge FlatList render.", metadata: { id: "rn-perf" } }),
  new Document({ pageContent: "Morning habits that stuck.\n\nWriting before email changed how my days went.", metadata: { id: "habits" } }),
  new Document({ pageContent: "Retrieval for a Slack assistant.\n\nChunking, BM25 and embeddings over a codebase.", metadata: { id: "rag" } }),
];

describe("splitMarkdown", () => {
  it("splits on markdown structure and cleans each chunk", async () => {
    const text = Array.from({ length: 6 }, (_, i) => `## Part ${i}\n\n**Bold** ${"word ".repeat(30)}`).join("\n\n");
    const chunks = await splitMarkdown([new Document({ pageContent: text, metadata: { id: "d" } })], {
      chunkSize: 250,
      chunkOverlap: 0,
      clean: (t) => t.replace(/\*\*/g, ""),
    });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.pageContent.length <= 250 && !c.pageContent.includes("**"))).toBe(true);
    expect(chunks.every((c) => c.metadata.id === "d")).toBe(true);
  });
});

describe("KeywordRetriever", () => {
  const retriever = new KeywordRetriever({ docs, k: 3 });

  it("ranks the matching document first, ignoring case", async () => {
    const [top] = await retriever.invoke("why is my flatlist slow on android");
    expect(top.metadata.id).toBe("rn-perf");
    expect(top.pageContent).toContain("FlatList");
    expect(top.metadata.score).toBeGreaterThan(0);
  });

  it("returns nothing for unrelated or stopword-only queries", async () => {
    expect(await retriever.invoke("zebra quantum")).toEqual([]);
    expect(await retriever.invoke("the and with")).toEqual([]);
  });
});

describe("RAGBase", () => {
  it("runs retrieve → generate → parse", async () => {
    const llm = new RecordingChatModel('Sure! {"title": "Hello {braces} ok"}');
    const task = new RAGBase<{ topic: string }, { title: string }>({
      llm,
      retriever: new KeywordRetriever({ docs, k: 3 }),
      topK: 1,
      instructions: (i) => `Title a post about ${i.topic}. Keep {curly} text literal.`,
      query: (i) => i.topic,
      prompt: (i, context) => `CONTEXT:\n${context}\n\nTOPIC: ${i.topic}`,
      parse: (text) => parseJSON(text),
    });
    const { output, sources } = await task.run({ topic: "chunking embeddings" });
    expect(output).toEqual({ title: "Hello {braces} ok" });
    expect(sources.map((s) => s.metadata.id)).toEqual(["rag"]);
    expect(llm.sent().system).toBe("Title a post about chunking embeddings. Keep {curly} text literal.");
    expect(llm.sent().user).toContain("Chunking, BM25");
  });

  it("filters hits, works without a retriever, and exposes the graph", async () => {
    const llm = new RecordingChatModel("  done  ");
    const base = new RAGBase<string>({ llm, instructions: "x", prompt: (i, c) => `${c}|${i}` });
    expect((await base.run("hi")).output).toBe("done");
    expect(llm.sent().user).toBe("|hi");

    const filtered = base.with({ retriever: new KeywordRetriever({ docs, k: 3 }), filter: (d) => d.filter((x) => x.metadata.id !== "habits") });
    expect((await filtered.run("habits email")).sources).toEqual([]);
    expect(Object.keys(base.graph.getGraph().nodes)).toEqual(expect.arrayContaining(["retrieve", "generate", "parse"]));
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

describe("chatModelFromEnv", () => {
  it("picks a provider", () => {
    expect(chatModelFromEnv({})).toBeNull();
    const anthropic = chatModelFromEnv({ ANTHROPIC_API_KEY: "k" });
    expect(anthropic).toBeInstanceOf(ChatAnthropic);
    expect((anthropic as ChatAnthropic).model).toBe("claude-sonnet-5-5");
    expect(chatModelFromEnv({ GEMINI_API_KEY: "g" })).toBeInstanceOf(ChatGeminiInteractions);
    expect((chatModelFromEnv({ GOOGLE_API_KEY: "g", AI_MODEL: "gemini-4-argon" }) as ChatGeminiInteractions).model).toBe("gemini-4-argon");
    expect(chatModelFromEnv({ ANTHROPIC_API_KEY: "a", GEMINI_API_KEY: "g", AI_PROVIDER: "gemini" })).toBeInstanceOf(ChatGeminiInteractions);
    expect(chatModelFromEnv({ AI_PROVIDER: "gemini", ANTHROPIC_API_KEY: "a" })).toBeNull();
    expect(chatModelFromEnv({ OPENAI_API_KEY: "k" })).toBeNull();
    const openai = chatModelFromEnv({ AI_BASE_URL: "http://localhost:11434/v1", AI_MODEL: "llama3" }) as ChatOpenAI;
    expect(openai).toBeInstanceOf(ChatOpenAI);
    expect(openai.useResponsesApi).toBe(true);
  });
});

describe("ChatGeminiInteractions", () => {
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
    const model = new ChatGeminiInteractions({ client: fakeClient(create), maxTokens: 100 });
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
    await new ChatGeminiInteractions({ client: fakeClient(create) }).invoke("hi");
    const opts = create.mock.calls[0][1] as { retries: unknown; fetch_options: { signal: AbortSignal } };
    expect(opts.retries).toEqual({ strategy: "none" });
    expect(opts.fetch_options.signal).toBeInstanceOf(AbortSignal);
  });

  it("retries a 503 through LangChain, then reports it", async () => {
    const overloaded = Object.assign(new Error("API error occurred"), { statusCode: 503, body: '{"error":{"message":"The model is overloaded."}}' });
    const create = vi.fn(async () => Promise.reject(overloaded));
    const model = new ChatGeminiInteractions({ client: fakeClient(create), maxRetries: 1 });
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
    const model = new ChatGeminiInteractions({ client: fakeClient(create), timeoutMs: 50, maxRetries: 2 });
    await expect(model.invoke("hi")).rejects.toMatchObject({ status: 504, message: "gemini: no answer after 0s" });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("reports interactions without an answer, and maps SDK errors", async () => {
    const run = (result: () => Promise<unknown>) => new ChatGeminiInteractions({ client: fakeClient(result), maxRetries: 0 }).invoke("hi");
    await expect(run(async () => ({ status: "incomplete", steps: [] }))).rejects.toThrow("gemini: no answer (incomplete)");
    await expect(run(async () => ({ status: "failed", steps: [], errors: [{ message: "blocked for safety" }] }))).rejects.toThrow("blocked for safety");
    expect((await run(async () => ({ status: "completed", steps: [], output_text: "fallback" }))).text).toBe("fallback");

    const sdkError = Object.assign(new Error("API error occurred"), { statusCode: 400, body: '{"error":{"message":"API key not valid"}}' });
    const failing = run(async () => Promise.reject(sdkError));
    await expect(failing).rejects.toBeInstanceOf(LLMError);
    await expect(failing).rejects.toThrow("gemini 400: API key not valid");
  });
});
