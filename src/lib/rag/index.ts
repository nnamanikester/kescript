/**
 * Reusable RAG on LangChain + LangGraph. Server-side only (models hold API keys).
 *
 *  - RAGBase: a retrieve → generate → parse LangGraph graph, configured per task
 *  - splitMarkdown + KeywordRetriever: LangChain's MarkdownTextSplitter and BM25Retriever
 *  - chatModelFromEnv: ChatAnthropic, ChatGeminiInteractions or ChatOpenAI (Responses API)
 *
 * Anything LangChain-shaped plugs in: other chat models, vector-store retrievers, EnsembleRetriever.
 */
export { RAGBase, defaultFormatContext, parseJSON, unfence, type RAGBaseOptions, type RAGResult } from "./RAGBase";
export { splitMarkdown, KeywordRetriever, type SplitOptions } from "./documents";
export { chatModelFromEnv } from "./models";
export { ChatGeminiInteractions, LLMError, type ChatGeminiInteractionsParams } from "./gemini-interactions";
