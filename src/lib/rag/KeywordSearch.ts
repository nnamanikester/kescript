import { Document } from "@langchain/core/documents";
import { BM25Retriever } from "@langchain/community/retrievers/bm25";
import { MarkdownTextSplitter } from "@langchain/textsplitters";

/** A piece of a longer text, with whatever the caller wants to know about where it came from. */
export interface Passage<Meta> {
  text: string;
  meta: Meta;
  /** How well it matched the search (BM25); higher is better. */
  score: number;
}

export interface SourceText<Meta> {
  text: string;
  meta: Meta;
}

/**
 * Keyword search over markdown texts.
 *
 *   const search = await KeywordSearch.fromMarkdown([{ text: post.body, meta: { slug } }]);
 *   const passages = await search.find("flatlist performance");
 *
 * Each text is cut into passages at headings and paragraphs, and passages are
 * ranked with BM25 (LangChain's BM25Retriever).
 */
export class KeywordSearch<Meta> {
  private readonly bm25: BM25Retriever | null;

  /** Splits every text into passages of about `chunkSize` characters, then indexes them. */
  static async fromMarkdown<Meta>(
    sources: SourceText<Meta>[],
    { chunkSize = 900, chunkOverlap = 120, clean = (text: string) => text } = {},
  ): Promise<KeywordSearch<Meta>> {
    const splitter = new MarkdownTextSplitter({ chunkSize, chunkOverlap });
    const passages: SourceText<Meta>[] = [];
    for (const source of sources) {
      for (const chunk of await splitter.splitText(source.text)) {
        const text = clean(chunk).trim();
        if (text) passages.push({ text, meta: source.meta });
      }
    }
    return new KeywordSearch(passages);
  }

  constructor(private readonly passages: SourceText<Meta>[]) {
    // BM25Retriever compares text exactly ("FlatList" ≠ "flatlist"), so it indexes lowercase copies.
    // Each copy remembers its position, to hand back the original passage.
    const lowercase = passages.map((p, index) => new Document({ pageContent: p.text.toLowerCase(), metadata: { index } }));
    this.bm25 = passages.length ? new BM25Retriever({ docs: lowercase, k: passages.length, includeScore: true }) : null;
  }

  /** The passages that share words with the query, best match first. */
  async find(query: string, limit = 15): Promise<Passage<Meta>[]> {
    const words = keywords(query);
    if (!this.bm25 || !words.length) return [];
    const hits = (await this.bm25.invoke(words.join(" "))) as Document<{ index: number; bm25Score: number }>[];
    return hits
      .filter((hit) => hit.metadata.bm25Score > 0)
      .slice(0, limit)
      .map((hit) => ({ ...this.passages[hit.metadata.index], score: hit.metadata.bm25Score }));
  }
}

const STOPWORDS = new Set(
  "about after also and are because been but can could did does for from had has have her his how into its just like more most not our out over she some than that the their them then there these they this was were what when where which who why will with would you your".split(
    " ",
  ),
);

/** The words worth searching for: lowercase, no duplicates, no short or common words. */
export function keywords(text: string): string[] {
  const words = text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}_-]+/gu) ?? [];
  return [...new Set(words)].filter((word) => word.length > 2 && !STOPWORDS.has(word));
}
