/**
 * RAGBase: retrieval-augmented generation as a small LangGraph graph.
 *
 *   START → retrieve → generate → parse → END
 *
 *  - retrieve: any LangChain retriever (BM25, a vector store's .asRetriever(), an EnsembleRetriever…)
 *  - generate: a ChatPromptTemplate piped into any LangChain chat model
 *  - parse:    your function from the model's text to a typed output
 *
 * Everything that varies between tasks is an option, so a task is just a
 * configured instance:
 *
 *   const summarise = new RAGBase<{ text: string }, string>({
 *     llm: chatModelFromEnv()!,
 *     retriever: new KeywordRetriever({ docs: chunks }),
 *     instructions: "Summarise in the author's voice.",
 *     query: (i) => i.text,
 *     prompt: (i, context) => `${context}\n\nSummarise:\n${i.text}`,
 *   });
 *   const { output, sources } = await summarise.run({ text });
 */
import type { DocumentInterface } from "@langchain/core/documents";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { BaseMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import type { BaseRetrieverInterface } from "@langchain/core/retrievers";
import type { RunnableConfig } from "@langchain/core/runnables";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

export interface RAGBaseOptions<I, O> {
  llm: BaseChatModel;
  /** The system prompt. A function when it depends on the input. */
  instructions: string | ((input: I) => string);
  /** Omit for a plain prompt-and-parse task with no retrieval. */
  retriever?: BaseRetrieverInterface;
  /** Documents to keep after filtering. Default 6. */
  topK?: number;
  /** What to search for. Default: the input, if it's a string. */
  query?: (input: I) => string;
  /** Last say on the hits: exclude the current document, cap per source, re-rank. */
  filter?: (docs: DocumentInterface[], input: I) => DocumentInterface[];
  /** How retrieved documents are shown to the model. Default: numbered excerpts. */
  formatContext?: (docs: DocumentInterface[], input: I) => string;
  /** The user message, given the input and the formatted context. */
  prompt: (input: I, context: string) => string;
  /** Earlier turns to include before the prompt, e.g. few-shot examples. */
  history?: (input: I) => BaseMessage[];
  /** Reads the model's text into the output type. Default: trimmed text. */
  parse?: (text: string, input: I) => O;
}

export interface RAGResult<O> {
  output: O;
  /** The documents the answer was grounded in, best first. */
  sources: DocumentInterface[];
  /** The model's raw text, before parse(). */
  text: string;
}

export function defaultFormatContext(docs: DocumentInterface[]): string {
  return docs.map((d, i) => `[${i + 1}]\n${d.pageContent}`).join("\n\n---\n\n");
}

/** system → (history) → user. Values are passed as variables, so braces in them are never templated. */
const PROMPT = ChatPromptTemplate.fromMessages([
  ["system", "{instructions}"],
  new MessagesPlaceholder("history"),
  ["human", "{request}"],
]);

export class RAGBase<I, O = string> {
  /** The compiled LangGraph graph. `graph.getGraph().drawMermaidPng()` draws it. */
  readonly graph;

  constructor(readonly options: RAGBaseOptions<I, O>) {
    const State = Annotation.Root({
      input: Annotation<I>,
      sources: Annotation<DocumentInterface[]>,
      text: Annotation<string>,
      output: Annotation<O>,
    });
    type S = typeof State.State;

    const retrieve = async ({ input }: S, config?: RunnableConfig) => ({ sources: await this.retrieve(input, config) });

    const generate = async ({ input, sources }: S, config?: RunnableConfig) => {
      const o = this.options;
      const chain = PROMPT.pipe(o.llm).pipe(new StringOutputParser());
      const text = await chain.invoke(
        {
          instructions: typeof o.instructions === "function" ? o.instructions(input) : o.instructions,
          history: o.history?.(input) ?? [],
          request: o.prompt(input, (o.formatContext ?? defaultFormatContext)(sources, input)),
        },
        config,
      );
      return { text };
    };

    const parse = ({ input, text }: S) => ({ output: this.options.parse ? this.options.parse(text, input) : (text.trim() as O) });

    this.graph = new StateGraph(State)
      .addNode("retrieve", retrieve)
      .addNode("generate", generate)
      .addNode("parse", parse)
      .addEdge(START, "retrieve")
      .addEdge("retrieve", "generate")
      .addEdge("generate", "parse")
      .addEdge("parse", END)
      .compile();
  }

  /** A copy with some options replaced: another model, other instructions, more context. */
  with(overrides: Partial<RAGBaseOptions<I, O>>): RAGBase<I, O> {
    return new RAGBase({ ...this.options, ...overrides });
  }

  async retrieve(input: I, config?: RunnableConfig): Promise<DocumentInterface[]> {
    const { retriever, topK = 6, query, filter } = this.options;
    if (!retriever) return [];
    const q = query ? query(input) : typeof input === "string" ? input : "";
    if (!q.trim()) return [];
    const docs = await retriever.invoke(q, config);
    return (filter ? filter(docs, input) : docs).slice(0, topK);
  }

  /** Runs the graph. `signal` cancels the model call when the client goes away. */
  async run(input: I, { signal }: { signal?: AbortSignal } = {}): Promise<RAGResult<O>> {
    const state = await this.graph.invoke({ input }, { signal });
    return { output: state.output as O, sources: state.sources ?? [], text: state.text };
  }
}

/**
 * Pull a JSON value out of a model reply that may wrap it in prose or a code
 * fence. Throws when there's nothing parseable.
 */
export function parseJSON<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? text;
  const start = candidate.search(/[[{]/);
  if (start === -1) throw new Error("The model didn't return JSON");
  const open = candidate[start];
  const end = candidate.lastIndexOf(open === "{" ? "}" : "]");
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}

/** Strip a single code fence wrapped around a whole reply. */
export function unfence(text: string): string {
  const m = text.trim().match(/^```[\w-]*\n([\s\S]*?)\n?```$/);
  return (m ? m[1] : text).trim();
}
