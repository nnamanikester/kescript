import { GoogleGenAI, type GoogleGenAIInteraction as Interaction } from "@google/genai";
import { BaseChatModel, type BaseChatModelParams } from "@langchain/core/language_models/chat_models";
import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import type { ChatResult } from "@langchain/core/outputs";
import { stampRetryable } from "@langchain/core/errors";

type InteractionRequest = Parameters<GoogleGenAI["interactions"]["create"]>[0];

/** A failed model call, with the HTTP status the API route turns into a message. */
export class LLMError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "LLMError";
  }
}

export interface GeminiChatModelParams extends BaseChatModelParams {
  apiKey?: string;
  /** A ready-made client (tests pass a fake); `apiKey` is then ignored. */
  client?: GoogleGenAI;
  model?: string;
  maxTokens?: number;
  /** How long Gemini thinks before answering. "low" keeps editing fast; null uses the model's default. */
  thinkingLevel?: "minimal" | "low" | "medium" | "high" | null;
  /** Thinking uses output tokens too, so this many are added on top of maxTokens. */
  thinkingTokens?: number;
  temperature?: number;
  /** Give up on a call after this long. */
  timeoutMs?: number;
}

/**
 * Gemini as a LangChain chat model, on Gemini's Interactions API.
 * LangChain's own Gemini model only uses generateContent; a BaseChatModel
 * subclass with _generate is LangChain's way to add another.
 */
export class GeminiChatModel extends BaseChatModel {
  readonly client: GoogleGenAI;
  readonly model: string;
  readonly maxTokens: number;
  readonly thinkingLevel: GeminiChatModelParams["thinkingLevel"];
  readonly thinkingTokens: number;
  readonly temperature?: number;
  readonly timeoutMs: number;

  constructor({
    apiKey,
    client,
    model = "gemini-3.8-flash",
    maxTokens = 2048,
    thinkingLevel = "low",
    thinkingTokens = 2048,
    temperature,
    timeoutMs = 40_000,
    ...langchainParams
  }: GeminiChatModelParams = {}) {
    super(langchainParams);
    this.client = client ?? new GoogleGenAI({ apiKey });
    this.model = model;
    this.maxTokens = maxTokens;
    this.thinkingLevel = thinkingLevel;
    this.thinkingTokens = thinkingTokens;
    this.temperature = temperature;
    this.timeoutMs = timeoutMs;
  }

  _llmType() {
    return "gemini-interactions";
  }

  /** LangChain calls this for every invoke(). */
  async _generate(messages: BaseMessage[], options: this["ParsedCallOptions"]): Promise<ChatResult> {
    const request = this.toRequest(messages);
    // LangChain's caller retries failed calls (maxRetries, with backoff); it skips 4xx errors and timeouts.
    const interaction = await this.caller.call(() => this.send(request, options.signal));
    const text = answerText(interaction);
    return { generations: [{ text, message: new AIMessage(text) }] };
  }

  /** LangChain messages → an Interactions request. The system message becomes system_instruction. */
  private toRequest(messages: BaseMessage[]): InteractionRequest {
    const system = messages
      .filter((m) => m.type === "system")
      .map((m) => m.text)
      .join("\n\n");
    const turns = messages
      .filter((m) => m.type !== "system")
      .map((m) => ({
        type: m.type === "ai" ? ("model_output" as const) : ("user_input" as const),
        content: [{ type: "text" as const, text: m.text }],
      }));
    return {
      model: this.model,
      ...(system && { system_instruction: system }),
      input: turns,
      generation_config: {
        max_output_tokens: this.maxTokens + (this.thinkingLevel === null ? 0 : this.thinkingTokens),
        ...(this.temperature !== undefined && { temperature: this.temperature }),
        ...(this.thinkingLevel && { thinking_level: this.thinkingLevel }),
      },
      // Don't keep drafts on Google's side.
      store: false,
    };
  }

  /** One call to the API, with a timeout, and errors turned into LLMErrors. */
  private async send(request: InteractionRequest, cancel?: AbortSignal): Promise<Interaction> {
    // The SDK ignores its own timeout when it's given a signal, so the timeout is a signal too.
    const timeout = AbortSignal.timeout(this.timeoutMs);
    try {
      return (await this.client.interactions.create(request, {
        // Retrying is LangChain's job; the SDK would otherwise retry silently for up to 30s.
        retries: { strategy: "none" },
        fetch_options: { signal: cancel ? AbortSignal.any([cancel, timeout]) : timeout },
      })) as Interaction;
    } catch (err) {
      if (timeout.aborted && !cancel?.aborted) {
        // Not retried: retrying a call that hung would keep the editor waiting for minutes.
        throw stampRetryable(new LLMError(`gemini: no answer after ${Math.round(this.timeoutMs / 1000)}s`, 504), false);
      }
      throw toLLMError(err);
    }
  }
}

/** The answer's text, without the model's thinking. Throws when there is none. */
function answerText(interaction: Interaction): string {
  const text =
    (interaction.steps ?? [])
      .flatMap((step) => (step.type === "model_output" ? (step.content ?? []) : []))
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("") ||
    (interaction.output_text ?? "");
  if (!text && interaction.status !== "completed") {
    throw new LLMError(`gemini: no answer (${interaction.errors?.[0]?.message ?? interaction.status})`, 502);
  }
  return text;
}

/** An SDK error → an LLMError with its HTTP status and Google's message. Other errors pass through. */
function toLLMError(err: unknown): unknown {
  const e = err as { status?: unknown; statusCode?: unknown; body?: unknown; message?: string };
  const status = typeof e.status === "number" ? e.status : typeof e.statusCode === "number" ? e.statusCode : null;
  if (status === null) return err;
  let message = e.message ?? "request failed";
  try {
    message = (JSON.parse(String(e.body)) as { error?: { message?: string } }).error?.message ?? message;
  } catch {
    // The body isn't JSON; keep the SDK's message.
  }
  return new LLMError(`gemini ${status}: ${message}`, status);
}
