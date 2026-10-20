"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, X } from "lucide-react";
import { CATEGORIES, SITE, type Category } from "@/lib/site";
import { slugify } from "@/lib/utils";
import type { PostDraft } from "@/lib/editor/draft";
import { PostArt } from "@/components/ui/PostArt";
import { useAutosize } from "./useAutosize";

export type Meta = Omit<PostDraft, "body">;

interface Props {
  meta: Meta;
  slug: string;
  words: number;
  knownTags: string[];
  onChange: (patch: Partial<Meta>) => void;
  /** Enter in the title/subtitle moves into the body. */
  onEnterBody: () => void;
}

function TagInput({ tags, known, onChange }: { tags: string[]; known: string[]; onChange: (tags: string[]) => void }) {
  const [value, setValue] = useState("");
  const listId = useId();
  const add = (raw: string) => {
    const t = slugify(raw);
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setValue("");
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((t) => (
        <span key={t} className="inline-flex h-7 items-center gap-1 rounded-full border border-line pl-2.5 pr-1 font-mono text-[0.75rem] text-muted">
          #{t}
          <button
            type="button"
            onClick={() => onChange(tags.filter((x) => x !== t))}
            aria-label={`Remove ${t}`}
            className="grid h-5 w-5 place-items-center rounded-full text-faint hover:bg-hover hover:text-fg"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={value}
        list={listId}
        onChange={(e) => {
          // Picking from the datalist or typing a comma both commit the tag.
          const v = e.target.value;
          if (v.endsWith(",") || known.includes(v)) add(v.replace(/,$/, ""));
          else setValue(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(value);
          } else if (e.key === "Backspace" && !value && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        onBlur={() => value && add(value)}
        placeholder={tags.length ? "+ tag" : "+ add tags (Enter after each)"}
        aria-label="Add a tag"
        className="h-7 min-w-[9rem] flex-1 bg-transparent font-mono text-[0.75rem] text-fg outline-none placeholder:text-faint"
      />
      <datalist id={listId}>
        {known.filter((t) => !tags.includes(t)).map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
    </div>
  );
}

/** The post header, exactly as it renders — except every part of it is editable. */
export function HeaderFields({ meta, slug, words, knownTags, onChange, onEnterBody }: Props) {
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const subRef = useRef<HTMLTextAreaElement>(null);
  useAutosize(titleRef, meta.title);
  useAutosize(subRef, meta.subtitle);
  const toBody = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEnterBody();
    }
  };

  return (
    <header className="relative measure pb-8 pt-10 sm:pt-14">
      <div className="mb-10 overflow-hidden rounded-2xl border border-line bg-elev/70">
        <PostArt slug={slug || "untitled"} className="block aspect-[48/9] w-full opacity-90" cols={48} rows={9} />
      </div>

      <div className="flex items-center font-mono text-xs text-faint">
        <span>
          <span className="text-accent">~</span>/blog/
        </span>
        <label className="relative flex items-center">
          <span className="sr-only">Category</span>
          <select
            value={meta.category}
            onChange={(e) => onChange({ category: e.target.value as Category })}
            className="cursor-pointer appearance-none bg-transparent pr-4 [field-sizing:content] text-muted outline-none hover:text-fg"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-0 h-3 w-3" aria-hidden />
        </label>
      </div>

      <textarea
        ref={titleRef}
        value={meta.title}
        onChange={(e) => onChange({ title: e.target.value.replace(/\n/g, " ") })}
        onKeyDown={toBody}
        placeholder="Title"
        aria-label="Title"
        rows={1}
        autoFocus={!meta.title}
        className="mt-4 block w-full resize-none overflow-hidden bg-transparent text-balance text-[2.1rem] font-semibold leading-[1.12] tracking-[-0.035em] text-fg outline-none placeholder:text-faint/50 sm:text-[2.75rem]"
      />
      <textarea
        ref={subRef}
        value={meta.subtitle}
        onChange={(e) => onChange({ subtitle: e.target.value.replace(/\n/g, " ") })}
        onKeyDown={toBody}
        placeholder="Subtitle — one line on why this is worth reading"
        aria-label="Subtitle"
        rows={1}
        className="mt-4 block w-full resize-none overflow-hidden bg-transparent text-pretty text-lg leading-relaxed text-muted outline-none placeholder:text-faint/60"
      />

      <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-line py-3.5 font-mono text-[0.75rem] text-faint">
        <span className="flex items-center gap-2 text-muted">
          <Image src="/images/profile.jpg" alt="" width={20} height={20} className="h-5 w-5 rounded-full object-cover" />
          {SITE.author}
        </span>
        <label className="flex items-center gap-1.5">
          <span className="sr-only">Publish date</span>
          <input
            type="date"
            value={meta.date}
            onChange={(e) => e.target.value && onChange({ date: e.target.value })}
            className="cursor-pointer bg-transparent text-faint outline-none hover:text-fg [&::-webkit-calendar-picker-indicator]:opacity-40"
          />
        </label>
        <span>{Math.max(1, Math.round(words / 230))} min read</span>
        <span className="hidden sm:inline">{words.toLocaleString("en-US")} words</span>
      </div>

      <div className="mt-4">
        <TagInput tags={meta.tags} known={knownTags} onChange={(tags) => onChange({ tags })} />
      </div>
    </header>
  );
}
