/**
 * Chat models, all LangChain BaseChatModels so they're interchangeable:
 *  - ChatAnthropic (Messages API)
 *  - ChatGeminiInteractions (Gemini Interactions API, ./gemini-interactions)
 *  - ChatOpenAI on the Responses API (OpenAI, or any server that speaks it)
 */
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGeminiInteractions } from "./gemini-interactions";

/** Room for a rewritten passage; short answers stop early and cost nothing extra. */
const MAX_TOKENS = 4096;
/** LangChain retries 6 times by default; an editor waiting on a button should fail faster. */
const MAX_RETRIES = 2;

/**
 * The chat model this deployment is configured for, or null when none is.
 *  - AI_PROVIDER picks one explicitly: anthropic | gemini | openai
 *  - otherwise the first key found: ANTHROPIC_API_KEY, GEMINI_API_KEY
 *    (or GOOGLE_API_KEY), then OPENAI_API_KEY / AI_BASE_URL
 *  - AI_MODEL overrides the model (required for OpenAI)
 */
export function chatModelFromEnv(env: Record<string, string | undefined> = process.env): BaseChatModel | null {
  const model = env.AI_MODEL || undefined;
  const geminiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
  const provider =
    env.AI_PROVIDER?.toLowerCase() ||
    (env.ANTHROPIC_API_KEY ? "anthropic" : geminiKey ? "gemini" : env.OPENAI_API_KEY || env.AI_BASE_URL ? "openai" : "");

  if (provider === "anthropic" && env.ANTHROPIC_API_KEY) {
    return new ChatAnthropic({ apiKey: env.ANTHROPIC_API_KEY, model: model ?? "claude-sonnet-5-5", maxTokens: MAX_TOKENS, maxRetries: MAX_RETRIES });
  }
  if (provider === "gemini" && geminiKey) {
    return new ChatGeminiInteractions({ apiKey: geminiKey, model, maxTokens: MAX_TOKENS, maxRetries: MAX_RETRIES });
  }
  if (provider === "openai" && (env.OPENAI_API_KEY || env.AI_BASE_URL) && model) {
    return new ChatOpenAI({
      model,
      // Local servers like Ollama ignore the key, but the SDK insists on one.
      apiKey: env.OPENAI_API_KEY || "not-needed",
      configuration: env.AI_BASE_URL ? { baseURL: env.AI_BASE_URL } : undefined,
      useResponsesApi: true,
      // store: false on every response, so drafts aren't kept on OpenAI's side.
      zdrEnabled: true,
      maxTokens: MAX_TOKENS,
      maxRetries: MAX_RETRIES,
    });
  }
  return null;
}
