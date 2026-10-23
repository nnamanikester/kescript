import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AIMessage, HumanMessage, SystemMessage, type BaseMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import type { KeywordSearch, Passage } from "./KeywordSearch";

export interface RAGResult<Output, Meta> {
  output: Output;
  /** The passages the model was shown. */
  sources: Passage<Meta>[];
  /** How many times the model was asked: more than 1 when findProblem sent an answer back. */
  attempts: number;
  /** What findProblem still objected to after the last attempt, or null. */
  problem: string | null;
}

/** What the graph carries from step to step. */
const RAGState = Annotation.Root({
  input: Annotation<unknown>,
  sources: Annotation<Passage<unknown>[]>,
  messages: Annotation<BaseMessage[]>,
  reply: Annotation<string>,
  output: Annotation<unknown>,
  problem: Annotation<string | null>,
  attempts: Annotation<number>,
});
type State = typeof RAGState.State;

/**
 * Retrieval-augmented generation: look up related passages, ask the model with
 * them in the prompt, then read and check its reply.
 *
 *   START → retrieve → generate → check → END
 *                         ↑         │
 *                         └─────────┘  when findProblem() objects, up to maxAttempts
 *
 * A task is a subclass. It must say what to tell the model (instructions,
 * prompt) and how to read the reply (parse). It can also say what to search
 * for (searchQuery), which passages to keep (pickSources) and what counts as a
 * broken answer (findProblem).
 */
export abstract class RAGBase<Input, Output, Meta = unknown> {
  /** Model calls allowed when findProblem keeps objecting. */
  protected maxAttempts = 2;

  private readonly graph = new StateGraph(RAGState)
    .addNode("retrieve", (state) => this.retrieveStep(state))
    .addNode("generate", (state, config) => this.generateStep(state, config))
    .addNode("check", (state) => this.checkStep(state))
    .addEdge(START, "retrieve")
    .addEdge("retrieve", "generate")
    .addEdge("generate", "check")
    .addConditionalEdges("check", (state) => (state.problem && state.attempts < this.maxAttempts ? "generate" : END), ["generate", END])
    .compile();

  constructor(
    protected readonly llm: BaseChatModel,
    protected readonly search?: KeywordSearch<Meta>,
  ) {}

  /* ─────────── what each task defines ─────────── */

  /** The system prompt: the task's rules. */
  protected abstract instructions(input: Input): string;

  /** The user message, built from the input and the passages that were found. */
  protected abstract prompt(input: Input, sources: Passage<Meta>[]): string;

  /** Turns the model's reply into the output. Throw when the reply is unusable. */
  protected abstract parse(reply: string, input: Input): Output;

  /** What to search the passages for. Leave it out for no search. */
  protected searchQuery?(input: Input): string;

  /** Which of the found passages (best first) go into the prompt. Default: the first 5. */
  protected pickSources?(found: Passage<Meta>[], input: Input): Passage<Meta>[];

  /** A rule the output breaks, to send back to the model, or null when it's fine. Leave it out for no rules. */
  protected findProblem?(output: Output, input: Input): string | null;

  /* ─────────── running it ─────────── */

  /** Runs the task. `signal` cancels the model call, e.g. when the browser goes away. */
  async run(input: Input, signal?: AbortSignal): Promise<RAGResult<Output, Meta>> {
    const state = await this.graph.invoke({ input, attempts: 0, problem: null, messages: [] }, { signal });
    return {
      output: state.output as Output,
      sources: state.sources as Passage<Meta>[],
      attempts: state.attempts,
      problem: state.problem,
    };
  }

  /** Find passages related to the input. */
  private async retrieveStep(state: State) {
    const input = state.input as Input;
    const query = this.searchQuery?.(input) ?? "";
    const found = this.search && query.trim() ? await this.search.find(query) : [];
    return { sources: this.pickSources?.(found, input) ?? found.slice(0, 5) };
  }

  /** Ask the model. A retry continues the conversation: its last reply, then what was wrong with it. */
  private async generateStep(state: State, config: RunnableConfig) {
    const input = state.input as Input;
    const messages = state.problem
      ? [...state.messages, new AIMessage(state.reply), new HumanMessage(`That breaks a rule: ${state.problem} Reply again in the same format, fixing it.`)]
      : [new SystemMessage(this.instructions(input)), new HumanMessage(this.prompt(input, state.sources as Passage<Meta>[]))];
    const reply = await this.llm.invoke(messages, config);
    return { messages, reply: reply.text, attempts: state.attempts + 1 };
  }

  /** Read the reply and look for broken rules. */
  private checkStep(state: State) {
    const input = state.input as Input;
    const output = this.parse(state.reply, input);
    return { output, problem: this.findProblem?.(output, input) ?? null };
  }
}
