/** Turning content into retrievable chunks, with LangChain's splitter and BM25 retriever. */
import { Document } from "@langchain/core/documents";
import { BM25Retriever } from "@langchain/community/retrievers/bm25";
import { MarkdownTextSplitter } from "@langchain/textsplitters";

export interface SplitOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  /** Applied to each chunk after splitting, e.g. stripping markdown syntax. */
  clean?: (text: string) => string;
}

/** Markdown-aware chunks (headings, code fences and paragraphs are split points). */
export async function splitMarkdown(docs: Document[], { chunkSize = 900, chunkOverlap = 120, clean }: SplitOptions = {}): Promise<Document[]> {
  const chunks = await new MarkdownTextSplitter({ chunkSize, chunkOverlap }).splitDocuments(docs);
  if (!clean) return chunks;
  return chunks.map((c) => new Document({ ...c, pageContent: clean(c.pageContent) })).filter((c) => c.pageContent.trim());
}

const STOPWORDS = new Set(
  "about after also and are because been but can could did does for from had has have her his how into its just like more most not our out over she some than that the their them then there these they this was were what when where which who why will with would you your".split(" "),
);

/**
 * LangChain's BM25Retriever, made case-insensitive and stopword-free. The stock
 * one compares the lowercased query against the original text, so "flatlist"
 * never matches "FlatList", and it returns chunks that scored zero.
 */
export class KeywordRetriever extends BM25Retriever {
  static lc_name() {
    return "KeywordRetriever";
  }

  private readonly originals: Document[];

  constructor({ docs, k = 6 }: { docs: Document[]; k?: number }) {
    // Index lowercased copies; return the originals.
    super({ docs: docs.map((d, i) => new Document({ pageContent: d.pageContent.toLowerCase(), metadata: { i } })), k, includeScore: true });
    this.originals = docs;
  }

  async _getRelevantDocuments(query: string): Promise<Document[]> {
    const terms = [...new Set(query.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}_-]+/gu) ?? [])].filter((t) => t.length > 2 && !STOPWORDS.has(t));
    if (!terms.length) return [];
    const hits = (await super._getRelevantDocuments(terms.join(" "))) as Document<{ i: number; bm25Score: number }>[];
    return hits
      .filter((h) => h.metadata.bm25Score > 0)
      .map((h) => {
        const original = this.originals[h.metadata.i];
        return new Document({ ...original, metadata: { ...original.metadata, score: h.metadata.bm25Score } });
      });
  }
}
