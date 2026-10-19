"use client";

import { useEffect, useState } from "react";
import { useHydrated } from "@/components/ui/useHydrated";
import { ArrowUpRight, LogOut, MessageSquare } from "lucide-react";
import { GitHubIcon } from "@/components/ui/brand-icons";
import type { ReactionCounts, ReactionKey, Thread, ThreadComment } from "@/lib/reactions";
import { useGitHubAuth } from "./useGitHubAuth";
import { ReactionBar } from "./ReactionBar";
import { Comment } from "./Comment";
import { CommentEditor } from "./CommentEditor";

interface Props {
  issueNumber: number;
  issueUrl: string;
  initial: Thread | null;
}

type ApiError = { error: string; message?: string };

function toggleCounts(counts: ReactionCounts, key: ReactionKey, on: boolean): ReactionCounts {
  const cur = counts[key] ?? { count: 0, viewerHasReacted: false };
  return { ...counts, [key]: { count: Math.max(0, cur.count + (on ? 1 : -1)), viewerHasReacted: on } };
}

/**
 * The comment thread for a post, stored in the post's GitHub issue.
 * Server-rendered from the cached public thread, then refreshed as the reader.
 */
export function Discussion({ issueNumber, issueUrl, initial }: Props) {
  const auth = useGitHubAuth();
  const hydrated = useHydrated();
  const [thread, setThread] = useState<Thread | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [editorKey, setEditorKey] = useState(0);
  const draftKey = `draft:issue-${issueNumber}`;
  const base = `/api/thread/${issueNumber}`;
  const viewerLogin = auth.viewer?.login;

  // Re-fetch once we know who's reading, so "you reacted" and edit rights are theirs.
  useEffect(() => {
    if (!auth.ready) return;
    let cancelled = false;
    fetch(base, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Thread>) : null))
      .then((t) => !cancelled && t && setThread(t))
      .catch(() => {
        /* keep the server-rendered thread */
      });
    return () => {
      cancelled = true;
    };
  }, [auth.ready, viewerLogin, base]);

  /** Every write goes through here. A 401 re-opens sign-in and retries the same action. */
  async function call<T>(path: string, method: string, body: unknown, retry: () => void): Promise<T | null> {
    setError(null);
    try {
      const res = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = (await res.json()) as T | ApiError;
      if (res.status === 401) {
        auth.expire();
        if (auth.configured) auth.signIn(retry);
        return null;
      }
      if (!res.ok) {
        setError((data as ApiError).message ?? "That didn't work. Try again?");
        return null;
      }
      return data as T;
    } catch {
      setError("Network error. Check your connection and try again.");
      return null;
    }
  }

  /* ── reactions (optimistic) ─────────────────────────────────────────────── */

  async function reactToPost(key: ReactionKey) {
    if (!thread) return;
    const on = !(thread.reactions[key]?.viewerHasReacted ?? false);
    setThread((t) => (t ? { ...t, reactions: toggleCounts(t.reactions, key, on) } : t));
    const res = await call<{ reactions: ReactionCounts }>(`${base}/reactions`, "POST", { content: key, on }, () => reactToPost(key));
    setThread((t) => (t ? { ...t, reactions: res ? res.reactions : toggleCounts(t.reactions, key, !on) } : t));
  }

  async function reactToComment(comment: ThreadComment, key: ReactionKey) {
    const on = !(comment.reactions[key]?.viewerHasReacted ?? false);
    const patch = (fn: (c: ReactionCounts) => ReactionCounts) =>
      setThread((t) =>
        t ? { ...t, comments: t.comments.map((c) => (c.id === comment.id ? { ...c, reactions: fn(c.reactions) } : c)) } : t,
      );
    patch((r) => toggleCounts(r, key, on));
    const res = await call<{ reactions: ReactionCounts }>(
      `${base}/reactions`,
      "POST",
      { subjectId: comment.id, content: key, on },
      () => reactToComment(comment, key),
    );
    patch((r) => (res ? res.reactions : toggleCounts(r, key, !on)));
  }

  /** Signed out: sign in first, then do the thing they clicked. Not configured: GitHub does it. */
  function asViewer<A extends unknown[]>(fn: (...a: A) => void) {
    return (...args: A) => {
      if (!auth.configured) window.open(issueUrl, "_blank", "noopener");
      else if (!auth.viewer) auth.signIn(() => fn(...args));
      else fn(...args);
    };
  }

  /* ── comments ──────────────────────────────────────────────────────────── */

  async function post(body: string): Promise<boolean> {
    const comment = await call<ThreadComment>(`${base}/comments`, "POST", { body }, () => post(body));
    if (!comment) return false;
    setThread((t) => (t ? { ...t, comments: [...t.comments, comment], totalComments: t.totalComments + 1 } : t));
    setFresh((f) => new Set(f).add(comment.id));
    try {
      localStorage.removeItem(draftKey);
    } catch {
      /* ignore */
    }
    setEditorKey((k) => k + 1);
    requestAnimationFrame(() =>
      document.getElementById(`comment-${comment.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    return true;
  }

  async function submit(body: string) {
    if (!auth.configured) {
      window.open(`${issueUrl}#issuecomment-new`, "_blank", "noopener");
      return false;
    }
    if (!auth.viewer) {
      // The draft is already saved; it posts as soon as GitHub hands back a session.
      auth.signIn(() => post(body));
      return false;
    }
    return post(body);
  }

  async function edit(comment: ThreadComment, body: string): Promise<boolean> {
    const updated = await call<ThreadComment>(`${base}/comments`, "PATCH", { id: comment.id, body }, () => edit(comment, body));
    if (!updated) return false;
    setThread((t) => (t ? { ...t, comments: t.comments.map((c) => (c.id === updated.id ? updated : c)) } : t));
    return true;
  }

  async function remove(comment: ThreadComment) {
    const prev = thread;
    setThread((t) => (t ? { ...t, comments: t.comments.filter((c) => c.id !== comment.id), totalComments: t.totalComments - 1 } : t));
    const ok = await call<{ ok: true }>(`${base}/comments`, "DELETE", { id: comment.id }, () => remove(comment));
    if (!ok) setThread(prev);
  }

  const comments = thread?.comments ?? [];
  const count = thread?.totalComments ?? comments.length;

  return (
    <section id="discussion" aria-labelledby="discussion-title" className="scroll-mt-24">
      {/* Post reactions */}
      <div className="rounded-2xl border border-line bg-elev p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-medium text-fg">Was this useful?</p>
          <p className="font-mono text-xs text-faint">reactions are stored on GitHub</p>
        </div>
        <ReactionBar variant="full" reactions={thread?.reactions ?? {}} onToggle={asViewer(reactToPost)} />
      </div>

      <div className="mt-14 flex items-center justify-between gap-4">
        <h2 id="discussion-title" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-fg">
          <MessageSquare className="h-4.5 w-4.5 text-faint" />
          Discussion
          <span className="font-mono text-sm font-normal text-faint">{count}</span>
        </h2>
        <a
          href={issueUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-xs text-faint transition-colors hover:text-fg"
        >
          issue #{issueNumber}
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>

      {comments.length > 0 ? (
        <ol className="mt-8 space-y-8">
          {comments.map((c) => (
            <Comment
              key={c.id}
              comment={c}
              viewer={auth.viewer}
              isNew={fresh.has(c.id)}
              onReact={asViewer(reactToComment)}
              onEdit={edit}
              onDelete={remove}
            />
          ))}
        </ol>
      ) : (
        <p className="mt-6 text-sm text-faint">No comments yet. Questions, corrections, and war stories are all welcome.</p>
      )}

      <div className="mt-10">
        {thread?.locked ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-faint">Comments are closed on this post.</p>
        ) : (
          <>
            {auth.viewer && (
              <div className="mb-3 flex items-center gap-2.5 text-sm text-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${auth.viewer.avatarUrl}${auth.viewer.avatarUrl.includes("?") ? "&" : "?"}s=48`} alt="" className="h-6 w-6 rounded-full border border-line" />
                <span>
                  Commenting as <span className="font-medium text-fg">{auth.viewer.login}</span>
                </span>
                <button
                  type="button"
                  onClick={auth.signOut}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs text-faint transition-colors hover:bg-hover hover:text-fg"
                >
                  <LogOut className="h-3 w-3" /> sign out
                </button>
              </div>
            )}
            {hydrated ? (
              <CommentEditor key={editorKey} viewer={auth.viewer} draftKey={draftKey} onSubmit={submit} />
            ) : (
              <div className="h-[11.5rem] rounded-xl border border-line bg-elev" aria-hidden />
            )}
            {error && (
              <p role="alert" className="mt-3 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            {!auth.viewer && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-faint">
                <GitHubIcon className="h-3 w-3" />
                {auth.configured
                  ? "Comments are posted to GitHub as you. We only ask for permission to comment and react."
                  : "Posting opens the GitHub issue in a new tab."}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
