"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { ReactionKey, ThreadComment, Viewer } from "@/lib/reactions";
import { formatDate, relativeTime } from "@/lib/utils";
import { CommentEditor } from "./CommentEditor";
import { ReactionBar } from "./ReactionBar";
import { useHydrated } from "@/components/ui/useHydrated";

interface Props {
  comment: ThreadComment;
  viewer: Viewer | null;
  isNew?: boolean;
  onReact: (comment: ThreadComment, key: ReactionKey) => void;
  onEdit: (comment: ThreadComment, body: string) => Promise<boolean>;
  onDelete: (comment: ThreadComment) => void;
}

const BADGES: Record<string, string> = {
  OWNER: "Author",
  MEMBER: "Member",
  COLLABORATOR: "Collaborator",
};

export function Comment({ comment, viewer, isNew, onReact, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const hydrated = useHydrated();
  const badge = BADGES[comment.association];
  const when = hydrated ? relativeTime(comment.createdAt) : formatDate(comment.createdAt);

  if (comment.minimized) {
    return (
      <li className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-faint">
        This comment was hidden by a moderator.
      </li>
    );
  }

  return (
    <li id={`comment-${comment.id}`} className={`group/comment relative flex gap-3.5 ${isNew ? "animate-fade-up" : ""}`}>
      {comment.author ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${comment.author.avatarUrl}${comment.author.avatarUrl.includes("?") ? "&" : "?"}s=80`}
          alt=""
          width={36}
          height={36}
          loading="lazy"
          className="mt-0.5 h-9 w-9 shrink-0 rounded-full border border-line"
        />
      ) : (
        <div className="mt-0.5 h-9 w-9 shrink-0 rounded-full bg-subtle" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
          <a href={comment.author?.url ?? "#"} target="_blank" rel="noopener noreferrer" className="font-medium text-fg hover:text-accent">
            {comment.author?.login ?? "ghost"}
          </a>
          {badge && (
            <span className="rounded-full border border-accent/30 bg-accent-soft px-1.5 py-px font-mono text-[0.65rem] uppercase tracking-wide text-accent">
              {badge}
            </span>
          )}
          <a
            href={comment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-faint hover:text-muted"
            title={new Date(comment.createdAt).toISOString()}
            suppressHydrationWarning
          >
            {when}
          </a>
          {comment.editedAt && <span className="font-mono text-xs text-faint">· edited</span>}

          {(comment.viewerCanUpdate || comment.viewerCanDelete) && !editing && (
            <span className="ml-auto flex items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover/comment:opacity-100 sm:focus-within:opacity-100">
              {comment.viewerCanUpdate && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  aria-label="Edit comment"
                  className="grid h-7 w-7 place-items-center rounded-md text-faint hover:bg-hover hover:text-fg"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {comment.viewerCanDelete &&
                (confirming ? (
                  <span className="flex items-center gap-1 text-xs">
                    <button type="button" onClick={() => onDelete(comment)} className="rounded-md px-2 py-1 font-medium text-danger hover:bg-hover">
                      Delete
                    </button>
                    <button type="button" onClick={() => setConfirming(false)} className="rounded-md px-2 py-1 text-faint hover:bg-hover">
                      Keep
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    aria-label="Delete comment"
                    className="grid h-7 w-7 place-items-center rounded-md text-faint hover:bg-hover hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ))}
            </span>
          )}
        </div>

        {editing ? (
          <div className="mt-2">
            <CommentEditor
              viewer={viewer}
              initial={comment.body}
              submitLabel="Update"
              autoFocus
              onCancel={() => setEditing(false)}
              onSubmit={async (body) => {
                const ok = await onEdit(comment, body);
                if (ok) setEditing(false);
                return ok;
              }}
            />
          </div>
        ) : (
          <div className="comment-body mt-1.5" dangerouslySetInnerHTML={{ __html: comment.html }} />
        )}

        <div className="mt-2.5">
          <ReactionBar reactions={comment.reactions} onToggle={(key) => onReact(comment, key)} />
        </div>
      </div>
    </li>
  );
}
