/**
 * The discussion layer: each post's GitHub issue is its comment thread.
 *
 * Reads use the reader's own token when signed in (so `viewerHasReacted` and
 * edit/delete permissions are theirs), otherwise the site's GITHUB_TOKEN.
 * Writes always use the reader's token — comments and reactions are authored
 * by them on GitHub, not by the site.
 */
import { unstable_cache } from "next/cache";
import { GH } from "@/lib/site";
import { renderCommentHtml } from "@/lib/markdown/pipeline";
import type { ReactionCounts, ReactionKey, Thread, ThreadComment } from "@/lib/reactions";

export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function gql<T>(query: string, variables: Record<string, unknown>, token: string): Promise<T> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": `${GH.repo}-blog`,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (res.status === 401) throw new GitHubError("GitHub session expired", 401);
  if (!res.ok) throw new GitHubError(`GitHub ${res.status}`, res.status);
  const json = (await res.json()) as { data?: T; errors?: { message: string; type?: string }[] };
  if (json.errors?.length) {
    const forbidden = json.errors.some((e) => e.type === "FORBIDDEN" || /not have permission|Resource not accessible/i.test(e.message));
    throw new GitHubError(json.errors.map((e) => e.message).join("; "), forbidden ? 403 : 422);
  }
  return json.data as T;
}

const REACTION_FIELDS = `reactionGroups { content viewerHasReacted reactors { totalCount } }`;

const COMMENT_FIELDS = `
  id url body createdAt lastEditedAt authorAssociation
  viewerCanUpdate viewerCanDelete isMinimized
  author { login avatarUrl url }
  ${REACTION_FIELDS}
`;

const THREAD_QUERY = `
  query Thread($owner: String!, $repo: String!, $number: Int!, $after: String) {
    repository(owner: $owner, name: $repo) {
      issue(number: $number) {
        id number url locked
        ${REACTION_FIELDS}
        comments(first: 100, after: $after) {
          totalCount
          pageInfo { hasNextPage endCursor }
          nodes { ${COMMENT_FIELDS} }
        }
      }
    }
  }
`;

interface RawReactionGroup {
  content: ReactionKey;
  viewerHasReacted: boolean;
  reactors: { totalCount: number };
}

interface RawComment {
  id: string;
  url: string;
  body: string;
  createdAt: string;
  lastEditedAt: string | null;
  authorAssociation: string;
  viewerCanUpdate: boolean;
  viewerCanDelete: boolean;
  isMinimized: boolean;
  author: { login: string; avatarUrl: string; url: string } | null;
  reactionGroups: RawReactionGroup[];
}

function toCounts(groups: RawReactionGroup[] | null | undefined, asViewer: boolean): ReactionCounts {
  const counts: ReactionCounts = {};
  for (const g of groups ?? []) {
    if (g.reactors.totalCount > 0 || (asViewer && g.viewerHasReacted)) {
      counts[g.content] = { count: g.reactors.totalCount, viewerHasReacted: asViewer && g.viewerHasReacted };
    }
  }
  return counts;
}

async function toComment(c: RawComment, asViewer: boolean): Promise<ThreadComment> {
  return {
    id: c.id,
    url: c.url,
    author: c.author,
    association: c.authorAssociation,
    createdAt: c.createdAt,
    editedAt: c.lastEditedAt,
    body: asViewer && c.viewerCanUpdate ? c.body : "",
    html: c.isMinimized ? "" : await renderCommentHtml(c.body),
    reactions: toCounts(c.reactionGroups, asViewer),
    viewerCanUpdate: asViewer && c.viewerCanUpdate,
    viewerCanDelete: asViewer && c.viewerCanDelete,
    minimized: c.isMinimized,
  };
}

async function fetchThread(issueNumber: number, token: string, asViewer: boolean): Promise<Thread | null> {
  type Data = {
    repository: {
      issue: {
        id: string;
        number: number;
        url: string;
        locked: boolean;
        reactionGroups: RawReactionGroup[];
        comments: {
          totalCount: number;
          pageInfo: { hasNextPage: boolean; endCursor: string | null };
          nodes: RawComment[];
        };
      } | null;
    } | null;
  };

  let after: string | null = null;
  let thread: Thread | null = null;
  const raw: RawComment[] = [];
  for (let page = 0; page < 10; page++) {
    const data: Data = await gql<Data>(THREAD_QUERY, { owner: GH.owner, repo: GH.repo, number: issueNumber, after }, token);
    const issue = data.repository?.issue;
    if (!issue) return null;
    thread ??= {
      issueId: issue.id,
      issueNumber: issue.number,
      url: issue.url,
      locked: issue.locked,
      reactions: toCounts(issue.reactionGroups, asViewer),
      comments: [],
      totalComments: issue.comments.totalCount,
    };
    raw.push(...issue.comments.nodes);
    if (!issue.comments.pageInfo.hasNextPage) break;
    after = issue.comments.pageInfo.endCursor;
  }
  if (!thread) return null;
  thread.comments = await Promise.all(raw.map((c) => toComment(c, asViewer)));
  return thread;
}

export const threadTag = (issueNumber: number) => `thread-${issueNumber}`;

/** Anonymous view, cached briefly so traffic doesn't burn the site token's rate limit. */
export function getPublicThread(issueNumber: number): Promise<Thread | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return Promise.resolve(null);
  return unstable_cache(() => fetchThread(issueNumber, token, false), ["thread", String(issueNumber)], {
    revalidate: 60,
    tags: [threadTag(issueNumber)],
  })();
}

export function getViewerThread(issueNumber: number, userToken: string): Promise<Thread | null> {
  return fetchThread(issueNumber, userToken, true);
}

/* ───────────────────────────────── writes ──────────────────────────────── */

export async function addComment(subjectId: string, body: string, token: string): Promise<ThreadComment> {
  const data = await gql<{ addComment: { commentEdge: { node: RawComment } } }>(
    `mutation($subjectId: ID!, $body: String!) {
      addComment(input: { subjectId: $subjectId, body: $body }) { commentEdge { node { ${COMMENT_FIELDS} } } }
    }`,
    { subjectId, body },
    token,
  );
  return toComment(data.addComment.commentEdge.node, true);
}

export async function updateComment(id: string, body: string, token: string): Promise<ThreadComment> {
  const data = await gql<{ updateIssueComment: { issueComment: RawComment } }>(
    `mutation($id: ID!, $body: String!) {
      updateIssueComment(input: { id: $id, body: $body }) { issueComment { ${COMMENT_FIELDS} } }
    }`,
    { id, body },
    token,
  );
  return toComment(data.updateIssueComment.issueComment, true);
}

export async function deleteComment(id: string, token: string): Promise<void> {
  await gql(`mutation($id: ID!) { deleteIssueComment(input: { id: $id }) { clientMutationId } }`, { id }, token);
}

/** Toggle a reaction on an issue or a comment; returns the subject's fresh counts. */
export async function setReaction(
  subjectId: string,
  content: ReactionKey,
  on: boolean,
  token: string,
): Promise<ReactionCounts> {
  const mutation = on ? "addReaction" : "removeReaction";
  const data = await gql<Record<string, { subject: { reactionGroups: RawReactionGroup[] } }>>(
    `mutation($subjectId: ID!, $content: ReactionContent!) {
      ${mutation}(input: { subjectId: $subjectId, content: $content }) {
        subject { ... on Reactable { ${REACTION_FIELDS} } }
      }
    }`,
    { subjectId, content },
    token,
  );
  return toCounts(data[mutation].subject.reactionGroups, true);
}

export async function getViewer(token: string): Promise<{ login: string; avatarUrl: string; name: string | null }> {
  const data = await gql<{ viewer: { login: string; avatarUrl: string; name: string | null } }>(
    `query { viewer { login avatarUrl name } }`,
    {},
    token,
  );
  return data.viewer;
}
