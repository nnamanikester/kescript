/** Category names and their `category:<Name>` labels. Client-safe. */
import { CATEGORY_PREFIX, DEFAULT_CATEGORY } from "@/lib/site";
import { slugify } from "@/lib/utils";

/** GitHub caps label names at 50 characters, prefix included. */
const MAX_NAME = 50 - CATEGORY_PREFIX.length;

export const isCategoryLabel = (label: string) => label.toLowerCase().startsWith(CATEGORY_PREFIX);

export const categoryLabel = (name: string) => CATEGORY_PREFIX + name;

/**
 * A display name from a label, frontmatter or what the author typed:
 * "category:Case Study" and "Case Study" stay as-is; all-lowercase input
 * ("case-study", "essay") is title-cased. Empty when there's nothing usable.
 */
export function toCategoryName(value: unknown): string {
  let s = String(value ?? "");
  if (isCategoryLabel(s)) s = s.slice(CATEGORY_PREFIX.length);
  // Commas would split the label in GitHub's `labels=` filter.
  s = s.replace(/[,\s]+/g, " ").trim().slice(0, MAX_NAME).trim();
  if (!slugify(s)) return "";
  return s === s.toLowerCase() ? s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : s;
}

/** The post's `category:` label wins, then frontmatter, then the default. */
export function resolveCategory(labels: string[], frontmatter: unknown): string {
  const label = labels.find(isCategoryLabel);
  return (label && toCategoryName(label)) || toCategoryName(frontmatter) || DEFAULT_CATEGORY;
}
