/**
 * A small RAG toolkit on LangChain and LangGraph. Server-side only: models hold API keys.
 *
 *  KeywordSearch    finds the passages related to a query
 *  RAGBase          a task: search → ask the model → check the reply; subclass it per task
 *  createChatModel  the Claude, Gemini or OpenAI model the env vars ask for
 */
export { KeywordSearch, keywords, type Passage, type SourceText } from "./KeywordSearch";
export { RAGBase, type RAGResult } from "./RAGBase";
export { parseJSON, unfence } from "./replies";
export { createChatModel } from "./models";
export { GeminiChatModel, LLMError, type GeminiChatModelParams } from "./GeminiChatModel";
