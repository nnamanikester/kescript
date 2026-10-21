/**
 * A LangChain chat model for Gemini's Interactions API.
 *
 * LangChain's Google integrations only speak generateContent so far, so this
 * plugs the Interactions API in through LangChain's extension point:
 * subclass BaseChatModel and implement _generate. It then works anywhere a
 * ChatAnthropic or ChatOpenAI does (prompts, chains, LangGraph).
 */
import { GoogleGenAI, type GoogleGenAIInteraction as Interaction } from "@google/genai";
import { BaseChatModel, type BaseChatModelParams } from "@langchain/core/language_models/chat_models";
import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import type { ChatResult } from "@langchain/core/outputs";
import { stampRetryable } from "@langchain/core/errors";

export class LLMError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "LLMError";
  }
}

export interface ChatGeminiInteractionsParams extends BaseChatModelParams {
  /** Ignored when `client` is given. */
  apiKey?: string;
  client?: GoogleGenAI;
  model?: string;
  maxTokens?: number;
  /**
   * Gemini 3 reasons before answering, and those tokens count against the
   * output limit. "low" keeps editing tasks fast; null leaves the model's default.
   */
  thinkingLevel?: "minimal" | "low" | "medium" | "high" | null;
  /** Extra output tokens reserved for thinking, on top of maxTokens. */
  thinkingHeadroom?: number;
  temperature?: number;
  /** Keep interactions on Google's side (for previous_interaction_id). Off: drafts aren't left behind. */
  store?: boolean;
  /** Give up on one attempt after this long. Default 40s. */
  timeoutMs?: number;
}

export class ChatGeminiInteractions extends BaseChatModel {
  readonly client: GoogleGenAI;
  readonly model: string;
  readonly maxTokens: number;
  readonly thinkingLevel: ChatGeminiInteractionsParams["thinkingLevel"];
  readonly thinkingHeadroom: number;
  readonly temperature?: number;
  readonly store: boolean;
  readonly timeoutMs: number;

  constructor({
    apiKey,
    client,
    model = "gemini-3.8-flash",
    maxTokens = 2048,
    thinkingLevel = "low",
    thinkingHeadroom = 2048,
    temperature,
    store = false,
    timeoutMs = 40_000,
    ...base
  }: ChatGeminiInteractionsParams = {}) {
    super(base);
    this.client = client ?? new GoogleGenAI({ apiKey });
    this.model = model;
    this.maxTokens = maxTokens;
    this.thinkingLevel = thinkingLevel;
    this.thinkingHeadroom = thinkingHeadroom;
    this.temperature = temperature;
    this.store = store;
    this.timeoutMs = timeoutMs;
  }

  _llmType() {
    return "gemini-interactions";
  }

  async _generate(messages: BaseMessage[], options: this["ParsedCallOptions"]): Promise<ChatResult> {
    const system = messages
      .filter((m) => m.type === "system")
      .map((m) => m.text)
      .join("\n\n");
    // Turns become steps; Gemini calls the assistant's turns "model_output".
    const input = messages
      .filter((m) => m.type !== "system")
      .map((m) => ({
        type: m.type === "ai" ? ("model_output" as const) : ("user_input" as const),
        content: [{ type: "text" as const, text: m.text }],
      }));

    const params = {
      model: this.model,
      ...(system && { system_instruction: system }),
      input,
      generation_config: {
        max_output_tokens: this.maxTokens + (this.thinkingLevel === null ? 0 : this.thinkingHeadroom),
        ...(this.temperature !== undefined && { temperature: this.temperature }),
        ...(this.thinkingLevel && { thinking_level: this.thinkingLevel }),
      },
      store: this.store,
    };
    // LangChain's caller is the one retry policy (maxRetries, with backoff); it skips 4xx and timeouts.
    const interaction = await this.caller.call(() => this.attempt(params, options.signal));

    // Only the answer: thought steps are skipped.
    const text =
      (interaction.steps ?? [])
        .flatMap((step) => (step.type === "model_output" ? (step.content ?? []) : []))
        .map((c) => (c.type === "text" ? c.text : ""))
        .join("") ||
      (interaction.output_text ?? "");
    if (!text && interaction.status !== "completed") {
      throw new LLMError(`gemini: no answer (${interaction.errors?.[0]?.message ?? interaction.status})`, 502);
    }
    return { generations: [{ text, message: new AIMessage(text) }], llmOutput: { id: interaction.id, status: interaction.status } };
  }

  /** One request: its own timeout, and SDK errors mapped to an LLMError with the HTTP status. */
  private async attempt(params: Parameters<GoogleGenAI["interactions"]["create"]>[0], callerSignal?: AbortSignal) {
    // The SDK ignores its own timeout_ms when a signal is passed, so combine them here.
    const timeout = AbortSignal.timeout(this.timeoutMs);
    try {
      return (await this.client.interactions.create(params, {
        // The SDK otherwise retries 5xx/429 silently for up to 30s per call.
        retries: { strategy: "none" },
        fetch_options: { signal: callerSignal ? AbortSignal.any([callerSignal, timeout]) : timeout },
      })) as Interaction;
    } catch (err) {
      if (timeout.aborted && !callerSignal?.aborted) {
        // Retrying a request that just hung would leave the editor spinning for minutes.
        throw stampRetryable(new LLMError(`gemini: no answer after ${Math.round(this.timeoutMs / 1000)}s`, 504), false);
      }
      const e = err as { status?: unknown; statusCode?: unknown; body?: unknown; message?: string };
      const status = typeof e.status === "number" ? e.status : typeof e.statusCode === "number" ? e.statusCode : null;
      if (status === null) throw err;
      let detail = e.message ?? "request failed";
      try {
        detail = (JSON.parse(String(e.body)) as { error?: { message?: string } }).error?.message ?? detail;
      } catch {
        /* body isn't JSON */
      }
      throw new LLMError(`gemini ${status}: ${detail}`, status);
    }
  }
}
