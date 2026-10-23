import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { GeminiChatModel } from "./GeminiChatModel";

type Env = Record<string, string | undefined>;

/** Room for a rewritten passage; short answers stop early. */
const MAX_TOKENS = 4096;
/** LangChain retries 6 times by default; someone waiting on a button needs an answer sooner. */
const MAX_RETRIES = 2;

/**
 * The chat model this deployment is set up for, or null when there's none.
 *
 *  - AI_PROVIDER picks one: anthropic, gemini or openai.
 *  - Otherwise the first key found wins: ANTHROPIC_API_KEY, GEMINI_API_KEY
 *    (or GOOGLE_API_KEY), then OPENAI_API_KEY or AI_BASE_URL.
 *  - AI_MODEL picks the model (OpenAI needs it).
 */
export function createChatModel(env: Env = process.env): BaseChatModel | null {
  switch (pickProvider(env)) {
    case "anthropic":
      return anthropicModel(env);
    case "gemini":
      return geminiModel(env);
    case "openai":
      return openAIModel(env);
    default:
      return null;
  }
}

function pickProvider(env: Env): string {
  if (env.AI_PROVIDER) return env.AI_PROVIDER.toLowerCase();
  if (env.ANTHROPIC_API_KEY) return "anthropic";
  if (env.GEMINI_API_KEY || env.GOOGLE_API_KEY) return "gemini";
  if (env.OPENAI_API_KEY || env.AI_BASE_URL) return "openai";
  return "";
}

function anthropicModel(env: Env): BaseChatModel | null {
  if (!env.ANTHROPIC_API_KEY) return null;
  return new ChatAnthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    model: env.AI_MODEL || "claude-sonnet-5-5",
    maxTokens: MAX_TOKENS,
    maxRetries: MAX_RETRIES,
  });
}

function geminiModel(env: Env): BaseChatModel | null {
  const apiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  return new GeminiChatModel({ apiKey, model: env.AI_MODEL || undefined, maxTokens: MAX_TOKENS, maxRetries: MAX_RETRIES });
}

/** OpenAI, or any server that speaks its Responses API (Ollama, vLLM…) via AI_BASE_URL. */
function openAIModel(env: Env): BaseChatModel | null {
  if (!(env.OPENAI_API_KEY || env.AI_BASE_URL) || !env.AI_MODEL) return null;
  return new ChatOpenAI({
    model: env.AI_MODEL,
    // Local servers ignore the key, but the SDK requires one.
    apiKey: env.OPENAI_API_KEY || "not-needed",
    configuration: env.AI_BASE_URL ? { baseURL: env.AI_BASE_URL } : undefined,
    useResponsesApi: true,
    // Sends store: false, so drafts aren't kept on OpenAI's side.
    zdrEnabled: true,
    maxTokens: MAX_TOKENS,
    maxRetries: MAX_RETRIES,
  });
}
