"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, ImagePlus, Loader2, X } from "lucide-react";
import { SITE } from "@/lib/site";
import { today } from "@/lib/editor/draft";
import type { Meta } from "./HeaderFields";
import { imageFiles, uploadImage } from "./upload";
import { AiWand } from "./AiWand";
import { DELETE_CONFIRM } from "./deleteDraft";
import type { AiField } from "./ai";

interface Props {
  open: boolean;
  onClose: () => void;
  meta: Meta;
  autoSlug: string;
  autoDescription: string;
  issue: { number: number; url: string; status: "draft" | "published" } | null;
  busy: boolean;
  onUnpublish: () => void;
  onDelete: () => void;
  onChange: (patch: Partial<Meta>) => void;
  onDiscard: () => void;
  onGenerate?: (field: AiField) => Promise<void>;
}

function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-fg">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1.5 block text-xs leading-relaxed text-faint">{hint}</span>}
    </label>
  );
}

const input =
  "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-line-strong";

/** Everything a reader doesn't see on the page: URL, SEO, social card. */
export function SettingsSheet({ open, onClose, meta, autoSlug, autoDescription, issue, busy, onUnpublish, onDelete, onChange, onDiscard, onGenerate }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const host = SITE.url.replace(/^https?:\/\//, "");
  const desc = meta.description.length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const uploadCover = async (files: File[]) => {
    if (!files[0]) return;
    setUploading(true);
    setError(null);
    try {
      onChange({ image: await uploadImage(files[0]) });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  // Portalled: <main> is an isolated stacking context, which would keep the sheet under the sticky header.
  return createPortal(
    <div className={`fixed inset-0 z-[100] ${open ? "" : "pointer-events-none"}`} inert={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-bg/40 backdrop-blur-[2px] transition-opacity ${open ? "opacity-100" : "opacity-0"}`} />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-label="Post settings"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line bg-elev shadow-card outline-none transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
          <p className="font-mono text-xs text-faint">
            <span className="text-accent">~</span>/settings
          </p>
          <button type="button" onClick={onClose} aria-label="Close settings" className="grid h-8 w-8 place-items-center rounded-full text-faint hover:bg-hover hover:text-fg">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6">
          <Field
            label="URL"
            hint={issue?.status === "published" ? "Changing this breaks links people already shared." : "Set from the title until you change it."}
          >
            <div className="flex items-center rounded-lg border border-line bg-bg focus-within:border-line-strong">
              <span className="shrink-0 pl-3 font-mono text-xs text-faint">{host}/blog/</span>
              <input
                value={meta.slug}
                onChange={(e) => onChange({ slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                placeholder={autoSlug || "your-post"}
                spellCheck={false}
                className="min-w-0 flex-1 bg-transparent py-2 pr-3 font-mono text-xs text-fg outline-none placeholder:text-faint"
              />
            </div>
          </Field>

          <Field
            label="Description"
            hint={
              <>
                For Google and link previews. Aim for 120–160 characters.{" "}
                <span className={desc > 160 ? "text-danger" : desc >= 120 ? "text-ok" : ""}>{desc ? `${desc} now.` : "Empty uses the first paragraph."}</span>
              </>
            }
          >
            <div className="relative">
            <textarea
              value={meta.description}
              onChange={(e) => onChange({ description: e.target.value.replace(/\n/g, " ") })}
              placeholder={autoDescription || "What will someone get from reading this?"}
              rows={3}
              className={`${input} resize-none ${onGenerate ? "pr-10" : ""}`}
            />
            {onGenerate && (
              <AiWand label="Write a description from the post" onGenerate={() => onGenerate("description")} className="absolute right-1 top-1" />
            )}
            </div>
          </Field>

          <Field label="Social image" hint="Shown when the post is shared. Leave empty for the generated card.">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void uploadCover(imageFiles(e.target.files))} />
            {meta.image ? (
              <div className="overflow-hidden rounded-lg border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={meta.image} alt="" className="aspect-[1200/630] w-full object-cover" />
                <div className="flex justify-between border-t border-line px-3 py-2 text-xs">
                  <button type="button" onClick={() => fileRef.current?.click()} className="text-muted hover:text-fg">
                    Replace
                  </button>
                  <button type="button" onClick={() => onChange({ image: "" })} className="text-muted hover:text-danger">
                    Use generated card
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong py-6 text-sm text-muted hover:text-fg"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                {uploading ? "Uploading…" : "Upload 1200 × 630 image"}
              </button>
            )}
            {error && <span className="mt-1.5 block text-xs text-danger">{error}</span>}
          </Field>

          <label className="flex items-start justify-between gap-4">
            <span>
              <span className="block text-sm text-fg">Featured</span>
              <span className="mt-1 block text-xs text-faint">Pinned under “Start here” on the home page.</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={meta.featured}
              onChange={(e) => onChange({ featured: e.target.checked })}
              className="mt-1 h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-line-strong transition-colors before:block before:h-4 before:w-4 before:translate-x-0.5 before:rounded-full before:bg-elev before:shadow before:transition-transform checked:bg-accent checked:before:translate-x-[1.1rem]"
            />
          </label>

          <Field label="Last updated" hint="Shown next to the date when a post has been meaningfully revised.">
            <div className="flex gap-2">
              <input type="date" value={meta.updated} onChange={(e) => onChange({ updated: e.target.value })} className={input} />
              <button type="button" onClick={() => onChange({ updated: today() })} className="shrink-0 rounded-lg border border-line px-3 text-sm text-muted hover:text-fg">
                Today
              </button>
              {meta.updated && (
                <button type="button" onClick={() => onChange({ updated: "" })} className="shrink-0 rounded-lg px-2 text-sm text-faint hover:text-fg">
                  Clear
                </button>
              )}
            </div>
          </Field>

          <Field label="Canonical URL" hint="Only if this was first published somewhere else.">
            <input value={meta.canonical} onChange={(e) => onChange({ canonical: e.target.value.trim() })} placeholder="https://…" className={input} />
          </Field>

          {issue?.status === "published" && (
            <div className="rounded-xl border border-line p-4">
              <p className="text-sm text-fg">Unpublish</p>
              <p className="mt-1 text-xs leading-relaxed text-faint">
                Takes the post off the site, feeds and sitemap and turns it back into a draft. The issue, its comments and reactions
                are kept, so you can publish it again later.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => confirm("Take this post off the site? It becomes a draft again.") && onUnpublish()}
                className="mt-3 rounded-full border border-danger/40 px-3.5 py-1.5 text-xs text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
              >
                Unpublish post
              </button>
            </div>
          )}

          {issue?.status === "draft" && (
            <div className="rounded-xl border border-line p-4">
              <p className="text-sm text-fg">Delete draft</p>
              <p className="mt-1 text-xs leading-relaxed text-faint">
                Removes issue #{issue.number} from GitHub for good. If GitHub won&apos;t allow deleting, it&apos;s closed and taken off your drafts
                instead.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => confirm(DELETE_CONFIRM) && onDelete()}
                className="mt-3 rounded-full border border-danger/40 px-3.5 py-1.5 text-xs text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
              >
                Delete draft
              </button>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-line px-5 py-4 text-xs">
          {issue ? (
            <a href={issue.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-muted hover:text-fg">
              Issue #{issue.number} on GitHub <ArrowUpRight className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-faint">Only on this device</span>
          )}
          <button
            type="button"
            onClick={() => {
              if (confirm(issue ? "Throw away your unsaved changes and reload the version on GitHub?" : "Delete this local draft? This can't be undone.")) onDiscard();
            }}
            className="text-faint hover:text-danger"
          >
            {issue ? "Discard unsaved changes" : "Delete local draft"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
