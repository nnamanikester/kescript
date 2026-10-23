"use client";

import "katex/dist/katex.min.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Extension } from "@tiptap/core";
import { Slice } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import type { Root } from "hast";
import {
  ArrowUpRight,
  Check,
  Eye,
  Files,
  Loader2,
  PenLine,
  Save,
  Send,
  Settings2,
  TriangleAlert,
} from "lucide-react";
import { GH, SITE } from "@/lib/site";
import { toPlainText } from "@/lib/content-text";
import { relativeTime } from "@/lib/utils";
import {
  draftSlug,
  validateDraft,
  type PostDraft,
  type PostStatus,
} from "@/lib/editor/draft";
import { docToMarkdown, embedKind, markdownToDoc } from "@/lib/editor/markdown";
import { toast } from "@/components/site/Enhancers";
import { PostBody } from "@/components/post/PostBody";
import { editorExtensions } from "./extensions";
import { BubbleBar, EDIT_LINK_EVENT } from "./BubbleBar";
import { SlashMenu } from "./SlashMenu";
import { HeaderFields, type Meta } from "./HeaderFields";
import { SettingsSheet } from "./SettingsSheet";
import { imageFiles, uploadImage } from "./upload";
import { nextSaveAt } from "./autosave";
import { deletedMessage, requestDeleteDraft } from "./deleteDraft";
import { askAI, type AiField, type MetaSuggestion } from "./ai";

export interface WriterProps {
  issue: IssueRef | null;
  initial: PostDraft;
  knownTags: string[];
  knownCategories: string[];
  /** AI assists are configured on the server. */
  ai: boolean;
}

interface Stored {
  draft: PostDraft;
  savedAt: number;
}

export interface IssueRef {
  number: number;
  url: string;
  status: PostStatus;
}

interface Saved extends IssueRef {
  slug: string;
}

const keyFor = (issue: number | undefined) => `ks-write:${issue ?? "new"}`;

type Remote =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "saved"; at: number }
  | { state: "error"; message: string }
  | { state: "blocked"; message: string };

function readStored(key: string): Stored | null {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") as Stored | null;
  } catch {
    return null;
  }
}

function writeStored(key: string, draft: PostDraft) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ draft, savedAt: Date.now() } satisfies Stored),
    );
  } catch {
    /* storage full or blocked: GitHub is still the source of truth */
  }
}

function clearStored(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

const splitMeta = ({ body, ...meta }: PostDraft): [Meta, string] => [
  meta,
  body,
];
const same = (a: PostDraft, b: PostDraft) =>
  JSON.stringify({ ...a, body: a.body.trim() }) ===
  JSON.stringify({ ...b, body: b.body.trim() });

/** Markdown pasted from a code editor or a .md file should become blocks, not one long paragraph. */
function looksLikeMarkdown(text: string, html: string): boolean {
  if (
    html &&
    /<(p|h[1-6]|li|strong|em|a|img|table|blockquote)[\s>]/i.test(html)
  )
    return false;
  return (
    /^(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```|:::|\|.+\||!\[|\{%)/m.test(text) ||
    (/\n/.test(text) && /\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|`[^`]+`/.test(text))
  );
}

/** Drop a placeholder now, swap in the GitHub URL when the upload finishes. */
function insertImages(view: EditorView, files: File[], at?: number) {
  const type = view.state.schema.nodes.figure;
  for (const file of files) {
    const blob = URL.createObjectURL(file);
    const node = type.create({ src: blob, alt: "" });
    const tr =
      at === undefined
        ? view.state.tr.replaceSelectionWith(node)
        : view.state.tr.insert(at, node);
    view.dispatch(tr.scrollIntoView());

    const settle = (src: string | null) => {
      view.state.doc.descendants((n, pos) => {
        if (n.type !== type || n.attrs.src !== blob) return true;
        view.dispatch(
          src
            ? view.state.tr.setNodeMarkup(pos, undefined, { ...n.attrs, src })
            : view.state.tr.delete(pos, pos + n.nodeSize),
        );
        return false;
      });
      URL.revokeObjectURL(blob);
    };
    uploadImage(file).then(settle, (err: Error) => {
      settle(null);
      window.dispatchEvent(
        new CustomEvent("ks-writer-error", { detail: err.message }),
      );
    });
  }
}

export default function Writer({
  issue: initialIssue,
  initial,
  knownTags,
  knownCategories,
  ai,
}: WriterProps) {
  const [issue, setIssueState] = useState(initialIssue);
  // Timers outlive renders, so autosave reads the issue from a ref.
  const issueRef = useRef(initialIssue);
  const setIssue = (next: IssueRef | null) => {
    issueRef.current = next;
    setIssueState(next);
  };
  // Compare like with like: the issue as the editor would write it back, not its original spelling.
  const [baseline] = useState(() => ({
    ...initial,
    body: docToMarkdown(markdownToDoc(initial.body)),
  }));
  const key = keyFor(issue?.number);

  // A new post resumes the local draft. An existing post starts from GitHub and
  // offers the local copy, because the issue may have been edited elsewhere.
  const [stored] = useState(() => readStored(keyFor(initialIssue?.number)));
  const start = !initialIssue && stored ? stored.draft : initial;
  const [restorable, setRestorable] = useState<Stored | null>(
    initialIssue && stored && !same(stored.draft, baseline) ? stored : null,
  );

  const [meta, setMeta] = useState<Meta>(() => splitMeta(start)[0]);
  const metaRef = useRef(meta);
  /** The post as GitHub has it — what "unsaved changes" is measured against. */
  const githubRef = useRef<PostDraft | null>(initialIssue ? baseline : null);
  const [dirty, setDirty] = useState(!initialIssue);

  const [mode, setMode] = useState<"write" | "preview">("write");
  const [preview, setPreview] = useState<{ tree: Root } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<{
    text: string;
    auth?: boolean;
  } | null>(null);
  const [published, setPublished] = useState<Saved | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyRef = useRef(key);
  const [remote, setRemote] = useState<Remote>({ state: "idle" });
  const remoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  const again = useRef(false);
  const lastRemoteAt = useRef(0);
  const firstChangeAt = useRef<number | null>(null);
  const backoffUntil = useRef(0);
  /** Set once the draft is deleted: nothing may save it back. */
  const deleted = useRef(false);
  const router = useRouter();

  const extensions = useMemo(
    () => [
      ...editorExtensions({ upload: uploadImage }),
      Extension.create({
        name: "writerKeys",
        addKeyboardShortcuts() {
          return {
            "Mod-k": () => {
              if (
                this.editor.state.selection.empty &&
                !this.editor.isActive("link")
              )
                return false;
              window.dispatchEvent(new Event(EDIT_LINK_EVENT));
              return true;
            },
          };
        },
      }),
    ],
    [],
  );

  const editor = useEditor({
    extensions,
    content: markdownToDoc(splitMeta(start)[1]),
    immediatelyRender: true,
    editorProps: {
      // Keep the caret clear of the floating dock when typing near the bottom of the window.
      scrollThreshold: { top: 80, right: 0, bottom: 120, left: 0 },
      scrollMargin: { top: 80, right: 0, bottom: 120, left: 0 },
      attributes: {
        class: "prose writer-prose",
        "aria-label": "Post body",
        spellcheck: "true",
      },
      handlePaste(view, event) {
        const files = imageFiles(event.clipboardData?.files);
        if (files.length) {
          insertImages(view, files);
          return true;
        }
        const { $from } = view.state.selection;
        if ($from.parent.type.spec.code) return false;
        const text = event.clipboardData?.getData("text/plain") ?? "";
        const html = event.clipboardData?.getData("text/html") ?? "";
        const url = text.trim();
        if (
          !/\s/.test(url) &&
          embedKind(url) &&
          $from.parent.type.name === "paragraph" &&
          $from.parent.content.size === 0
        ) {
          const node = view.state.schema.nodes.embed.create({
            url,
            kind: embedKind(url),
          });
          view.dispatch(
            view.state.tr.replaceRangeWith($from.before(), $from.after(), node),
          );
          return true;
        }
        if (!looksLikeMarkdown(text, html)) return false;
        const doc = view.state.schema.nodeFromJSON(markdownToDoc(text));
        view.dispatch(
          view.state.tr
            .replaceSelection(Slice.maxOpen(doc.content))
            .scrollIntoView(),
        );
        return true;
      },
      handleDrop(view, event, _slice, moved) {
        if (moved) return false;
        const files = imageFiles(event.dataTransfer?.files);
        if (!files.length) return false;
        event.preventDefault();
        insertImages(
          view,
          files,
          view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos,
        );
        return true;
      },
    },
    onUpdate: () => schedule(),
  });

  const words = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? e.state.doc
            .textBetween(0, e.state.doc.content.size, " ", " ")
            .split(/\s+/)
            .filter(Boolean).length
        : 0,
  });

  const bodyNow = useCallback(
    () => (editor ? docToMarkdown(editor.getJSON()) : ""),
    [editor],
  );
  /** For event handlers: metaRef is current even before React re-renders. */
  const currentDraft = useCallback(
    (): PostDraft => ({ ...metaRef.current, body: bodyNow() }),
    [bodyNow],
  );

  /** Crash insurance only: GitHub is the real store once the post has a title. */
  const persist = useCallback(() => {
    timer.current = null;
    const draft = currentDraft();
    writeStored(keyRef.current, draft);
    setDirty(!githubRef.current || !same(githubRef.current, draft));
  }, [currentDraft]);

  /**
   * Save to GitHub. `auto` saves are quiet: no spinner on the buttons, and
   * failures retry with backoff instead of interrupting the writer.
   */
  async function push(
    target: "draft" | "publish",
    auto = false,
  ): Promise<void> {
    if (deleted.current) return;
    if (inFlight.current) {
      if (auto) again.current = true;
      return;
    }
    const publishing = target === "publish";
    const result = validateDraft(currentDraft(), { publishing });
    if ("error" in result) {
      if (auto) setRemote({ state: "blocked", message: result.error });
      else setProblem({ text: result.error });
      return;
    }
    if (auto && githubRef.current && same(githubRef.current, result.draft))
      return;

    const current = issueRef.current;
    inFlight.current = true;
    if (!auto) {
      setBusy(true);
      setProblem(null);
    }
    setRemote({ state: "saving" });
    try {
      const res = await fetch(
        current ? `/api/write/${current.number}` : "/api/write",
        {
          method: current ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...result.draft, publish: publishing }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as Partial<Saved> & {
        message?: string;
      };
      if (!res.ok || !data.number) {
        const message =
          data.message ?? `GitHub didn't accept that (${res.status})`;
        setRemote({ state: "error", message });
        if (res.status === 401 || !auto)
          setProblem({ text: message, auth: res.status === 401 });
        // Rate limited or refused: back off properly. Anything else: try again soon.
        backoffUntil.current =
          Date.now() +
          (res.status === 403 || res.status === 429 ? 60_000 : 20_000);
        if (auto && res.status !== 401) again.current = true;
        return;
      }
      const saved = data as Saved;
      githubRef.current = result.draft;
      lastRemoteAt.current = Date.now();
      firstChangeAt.current = null;
      backoffUntil.current = 0;
      clearStored(keyFor(undefined));
      setRemote({ state: "saved", at: lastRemoteAt.current });
      setRestorable(null);
      setIssue({ number: saved.number, url: saved.url, status: saved.status });
      if (!current) {
        keyRef.current = keyFor(saved.number);
        window.history.replaceState(null, "", `/write/${saved.number}`);
      }
      // Typing may have continued while the request was out.
      const now = currentDraft();
      setDirty(!same(result.draft, now));
      if (same(result.draft, now)) clearStored(keyRef.current);
      if (saved.status === "published") setPublished(saved);
      else if (!auto) toast("Draft saved to GitHub");
    } catch {
      setRemote({
        state: "error",
        message: "Offline — kept on this device, will retry",
      });
      backoffUntil.current = Date.now() + 20_000;
      if (auto) again.current = true;
      else
        setProblem({
          text: "Couldn't reach the server — your draft is safe on this device",
        });
    } finally {
      inFlight.current = false;
      if (!auto) setBusy(false);
      if (again.current) {
        again.current = false;
        scheduleRemote();
      }
    }
  }

  function scheduleRemote() {
    if (deleted.current) return;
    // Live posts only change when you press Update: autosave never publishes.
    if (issueRef.current?.status === "published") return;
    if (!metaRef.current.title.trim()) return;
    const now = Date.now();
    firstChangeAt.current ??= now;
    const at = nextSaveAt(
      now,
      firstChangeAt.current,
      lastRemoteAt.current,
      backoffUntil.current,
    );
    if (remoteTimer.current) clearTimeout(remoteTimer.current);
    remoteTimer.current = setTimeout(
      () => void push("draft", true),
      Math.max(0, at - now),
    );
  }

  function schedule() {
    if (deleted.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(persist, 500);
    scheduleRemote();
  }

  const updateMeta = (patch: Partial<Meta>) => {
    const next = { ...metaRef.current, ...patch };
    metaRef.current = next;
    setMeta(next);
    schedule();
  };

  /** Fill one metadata field from the post. Undo is just editing the field. */
  /** What the last generated description was built from, shown under it in Settings. */
  const [basis, setBasis] = useState<Pick<MetaSuggestion, "favorite" | "quoted" | "keyword"> | null>(null);
  const generate = async (field: AiField) => {
    const res = await askAI<MetaSuggestion>({ task: "meta", field, draft: currentDraft() });
    if (res[field]) updateMeta({ [field]: res[field] });
    if (field === "description") setBasis(res.favorite || res.keyword ? { favorite: res.favorite, quoted: res.quoted, keyword: res.keyword } : null);
  };

  // ⌘S saves now; leaving the page sends whatever autosave hadn't yet.
  useEffect(() => {
    const flush = () => {
      if (deleted.current) return;
      if (timer.current) persist();
      const current = issueRef.current;
      if (!current || current.status === "published" || !remoteTimer.current)
        return;
      const draft = currentDraft();
      if (
        !draft.title.trim() ||
        (githubRef.current && same(githubRef.current, draft))
      )
        return;
      const body = JSON.stringify({ ...draft, publish: false });
      // keepalive requests are capped at 64 KB; bigger drafts rely on the local copy.
      if (body.length < 60_000) {
        void fetch(`/api/write/${current.number}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        });
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        persist();
        if (issueRef.current?.status === "published")
          toast("Saved on this device — press Update to publish");
        else {
          if (remoteTimer.current) clearTimeout(remoteTimer.current);
          void push("draft");
        }
      }
    };
    const onError = (e: Event) =>
      setProblem({ text: (e as CustomEvent<string>).detail });
    window.addEventListener("keydown", onKey);
    window.addEventListener("pagehide", flush);
    window.addEventListener("ks-writer-error", onError);
    return () => {
      flush();
      if (remoteTimer.current) clearTimeout(remoteTimer.current);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("ks-writer-error", onError);
    };
    // push/scheduleRemote only read refs, so the first render's copies stay correct.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persist, currentDraft]);

  const loadDraft = (draft: PostDraft) => {
    const [m, body] = splitMeta(draft);
    metaRef.current = m;
    setMeta(m);
    editor?.commands.setContent(markdownToDoc(body));
    schedule();
  };

  const openPreview = async () => {
    setMode("preview");
    setPreview(null);
    try {
      const res = await fetch("/api/write/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: currentDraft().body }),
      });
      if (!res.ok)
        throw new Error(
          res.status === 401
            ? "Sign in again to preview"
            : `Preview failed (${res.status})`,
        );
      setPreview((await res.json()) as { tree: Root });
    } catch (e) {
      setProblem({ text: (e as Error).message });
      setMode("write");
    }
  };

  const check = confirmOpen
    ? validateDraft({ ...meta, body: bodyNow() })
    : null;

  const save = (target: "draft" | "publish") => {
    if (remoteTimer.current) clearTimeout(remoteTimer.current);
    return push(target);
  };

  const unpublish = async () => {
    if (!issue) return;
    setBusy(true);
    setProblem(null);
    try {
      const res = await fetch(`/api/write/${issue.number}/unpublish`, {
        method: "POST",
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        status?: PostStatus;
      };
      if (!res.ok)
        return setProblem({
          text: data.message ?? `GitHub didn't accept that (${res.status})`,
          auth: res.status === 401,
        });
      setIssue({ ...issue, status: "draft" });
      setPublished(null);
      setSettingsOpen(false);
      toast("Unpublished — it's a draft again");
    } catch {
      setProblem({ text: "Couldn't reach the server" });
    } finally {
      setBusy(false);
    }
  };

  const deleteDraft = async () => {
    if (!issue) return;
    setBusy(true);
    setProblem(null);
    // Stop pending saves first, or autosave could write the draft back.
    deleted.current = true;
    if (timer.current) clearTimeout(timer.current);
    if (remoteTimer.current) clearTimeout(remoteTimer.current);
    timer.current = remoteTimer.current = null;
    try {
      const outcome = await requestDeleteDraft(issue.number);
      clearStored(key);
      toast(deletedMessage(outcome));
      router.replace("/write/drafts");
      router.refresh();
    } catch (e) {
      deleted.current = false;
      setProblem({ text: (e as Error).message });
      setBusy(false);
    }
  };

  const slug = draftSlug(meta);
  const autoDescription = settingsOpen
    ? toPlainText(bodyNow()).slice(0, 160)
    : "";

  const live = issue?.status === "published";
  const status = live
    ? dirty
      ? "Changes not live yet"
      : "Live"
    : remote.state === "saving"
      ? "Saving to GitHub…"
      : remote.state === "error"
        ? "Not saved — retrying"
        : !meta.title.trim()
          ? "Add a title to start saving"
          : dirty
            ? "Unsaved changes"
            : issue
              ? "Draft saved to GitHub"
              : "Draft";
  const statusTitle =
    remote.state === "error" || remote.state === "blocked"
      ? remote.message
      : remote.state === "saved"
        ? `Saved to issue #${issue?.number} ${relativeTime(new Date(remote.at).toISOString())}`
        : live
          ? "Live posts change only when you press Update"
          : "Drafts save to GitHub automatically as you write";

  return (
    <div data-writer="" className="px-5 pb-16 sm:px-6">
      {restorable && (
        <div className="measure mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-elev px-4 py-3 text-sm shadow-card">
          <span className="text-muted">
            This browser has edits that never reached GitHub, from{" "}
            {relativeTime(new Date(restorable.savedAt).toISOString())}.
          </span>
          <span className="flex gap-2">
            <button
              type="button"
              onClick={() => (loadDraft(restorable.draft), setRestorable(null))}
              className="rounded-full bg-fg px-3 py-1 text-xs font-medium text-bg"
            >
              Restore them
            </button>
            <button
              type="button"
              onClick={() => (clearStored(key), setRestorable(null))}
              className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:text-fg"
            >
              Discard
            </button>
          </span>
        </div>
      )}

      <HeaderFields
        meta={meta}
        slug={slug}
        words={words}
        knownTags={knownTags}
        knownCategories={knownCategories}
        onChange={updateMeta}
        onEnterBody={() => editor?.commands.focus("start")}
        onGenerate={ai ? generate : undefined}
      />

      <div className={mode === "write" ? "" : "hidden"}>
        <EditorContent editor={editor} />
        {/* The editor is only as tall as its text; clicking below it continues at the end. */}
        <div
          aria-hidden
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus("end").run();
          }}
          className="measure h-20 cursor-text"
        />
      </div>
      {mode === "preview" && (
        <div className="mx-auto">
          {preview ? (
            <PostBody tree={preview.tree} />
          ) : (
            <p className="measure flex items-center gap-2 py-10 font-mono text-xs text-faint">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> rendering with
              the real pipeline…
            </p>
          )}
        </div>
      )}

      {editor && <BubbleBar editor={editor} ai={ai ? { title: meta.title, slug } : undefined} />}
      <SlashMenu />

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        meta={meta}
        autoSlug={draftSlug({ title: meta.title, slug: "" })}
        autoDescription={autoDescription}
        issue={issue}
        busy={busy}
        onUnpublish={() => void unpublish()}
        onDelete={() => void deleteDraft()}
        onChange={updateMeta}
        onGenerate={ai ? generate : undefined}
        basis={basis}
        onDiscard={() => {
          clearStored(key);
          loadDraft(
            issue && githubRef.current
              ? githubRef.current
              : { ...initial, title: "", body: "" },
          );
          setSettingsOpen(false);
        }}
      />

      {/* ── Dock ──────────────────────────────────────────────────────
          Portalled: <main> is an isolated stacking context, so a fixed bar
          inside it would sit under the site footer on short pages (Preview). */}
      {createPortal(
        <div className="writer-dock fixed inset-x-0 bottom-5 z-[70] flex flex-col items-center gap-2 px-3">
          {(confirmOpen || problem || published) && (
            <div className="w-full max-w-md rounded-2xl border border-line bg-elev/95 p-4 text-sm shadow-card backdrop-blur-xl animate-fade-up">
              {problem ? (
                <div className="flex items-start gap-3">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                  <div className="min-w-0 flex-1">
                    <p className="text-fg">{problem.text}</p>
                    {problem.auth && (
                      <a
                        href={`/api/auth/login?returnTo=${encodeURIComponent(issue ? `/write/${issue.number}` : "/write")}`}
                        className="mt-1 inline-block text-accent"
                      >
                        Sign in with GitHub again →
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setProblem(null)}
                    className="text-xs text-faint hover:text-fg"
                  >
                    Dismiss
                  </button>
                </div>
              ) : published && !confirmOpen ? (
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ok/15 text-ok">
                    <Check className="h-4 w-4" />
                  </span>
                  <p className="flex-1 text-fg">
                    {dirty
                      ? "Published — you've edited since."
                      : "Live on the site."}
                  </p>
                  <Link
                    href={`/blog/${published.slug}`}
                    className="rounded-full bg-fg px-3 py-1 text-xs font-medium text-bg"
                  >
                    View post
                  </Link>
                  <a
                    href={published.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-0.5 text-xs text-muted hover:text-fg"
                  >
                    Issue <ArrowUpRight className="h-3 w-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setPublished(null)}
                    aria-label="Dismiss"
                    className="text-xs text-faint hover:text-fg"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-fg">
                    {live ? "Update the live post?" : "Publish this post?"}
                  </p>
                  <dl className="mt-3 space-y-1.5 font-mono text-xs">
                    <div className="flex gap-3">
                      <dt className="w-16 shrink-0 text-faint">url</dt>
                      <dd className="truncate text-muted">
                        /blog/{slug || "…"}
                      </dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="w-16 shrink-0 text-faint">github</dt>
                      <dd className="truncate text-muted">
                        {!issue
                          ? `opens an issue in ${GH.owner}/${GH.repo}, labelled “${GH.publishedLabels[0]}”`
                          : live
                            ? `edits issue #${issue.number}`
                            : `issue #${issue.number}: draft → ${GH.publishedLabels[0]}`}
                      </dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="w-16 shrink-0 text-faint">filed</dt>
                      <dd className="truncate text-muted">
                        {meta.category} · {meta.date}
                        {meta.tags.length
                          ? ` · ${meta.tags.map((t) => "#" + t).join(" ")}`
                          : " · no tags"}
                      </dd>
                    </div>
                  </dl>
                  {check && "error" in check && (
                    <p className="mt-3 text-xs text-danger">{check.error}</p>
                  )}
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmOpen(false)}
                      className="rounded-full px-3.5 py-1.5 text-xs text-muted hover:text-fg"
                    >
                      Not yet
                    </button>
                    <button
                      type="button"
                      disabled={busy || Boolean(check && "error" in check)}
                      onClick={async () => {
                        await save("publish");
                        setConfirmOpen(false);
                      }}
                      className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                    >
                      {busy && <Loader2 className="h-3 w-3 animate-spin" />}
                      {live ? "Update" : "Publish"} to{" "}
                      {SITE.url.replace(/^https?:\/\//, "")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-1 rounded-full border border-line bg-elev/90 p-1 shadow-card backdrop-blur-xl">
            <span
              className="hidden items-center gap-2 pl-3 pr-2 font-mono text-[0.7rem] text-faint sm:flex"
              title={statusTitle}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  remote.state === "error"
                    ? "bg-danger"
                    : remote.state === "saving"
                      ? "bg-accent pulse-dot"
                      : dirty
                        ? "bg-accent"
                        : "bg-ok"
                }`}
                aria-hidden
              />
              {status}
            </span>
            <div
              className="flex rounded-full bg-subtle p-0.5"
              role="tablist"
              aria-label="Mode"
            >
              {(
                [
                  ["write", "Write", PenLine],
                  ["preview", "Preview", Eye],
                ] as const
              ).map(([m, label, Icon]) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  aria-label={label}
                  onClick={() =>
                    m === "preview" ? void openPreview() : setMode("write")
                  }
                  className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs transition-colors ${mode === m ? "bg-elev text-fg shadow-card" : "text-muted hover:text-fg"}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Post settings"
              title="URL, description, social image"
              className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-hover hover:text-fg"
            >
              <Settings2 className="h-4 w-4" />
            </button>
            <Link
              href="/write/drafts"
              aria-label="All drafts and posts"
              title="All drafts and posts"
              className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-hover hover:text-fg"
            >
              <Files className="h-4 w-4" />
            </Link>
            {!live && (
              <button
                type="button"
                onClick={() => void save("draft")}
                disabled={busy || (Boolean(issue) && !dirty)}
                title="Drafts save automatically. This saves now (⌘S). Drafts are issues in a public repo."
                className="flex h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-xs text-muted transition-colors hover:border-line-strong hover:text-fg disabled:opacity-40"
              >
                {busy && !confirmOpen ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">Save</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setProblem(null);
                setPublished(null);
                setConfirmOpen((o) => !o);
              }}
              disabled={busy || (live && !dirty)}
              className="flex h-9 items-center gap-1.5 rounded-full bg-fg pl-3.5 pr-4 text-xs font-medium text-bg transition-transform active:scale-[0.98] disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
              {live ? "Update" : "Publish"}
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
