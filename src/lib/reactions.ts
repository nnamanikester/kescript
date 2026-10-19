/** GitHub's reaction set, in GitHub's display order. Safe to import on the client. */
export const REACTIONS = [
  { key: "THUMBS_UP", emoji: "👍", label: "+1" },
  { key: "HEART", emoji: "❤️", label: "Heart" },
  { key: "ROCKET", emoji: "🚀", label: "Rocket" },
  { key: "HOORAY", emoji: "🎉", label: "Hooray" },
  { key: "EYES", emoji: "👀", label: "Eyes" },
  { key: "LAUGH", emoji: "😄", label: "Laugh" },
  { key: "CONFUSED", emoji: "😕", label: "Confused" },
  { key: "THUMBS_DOWN", emoji: "👎", label: "-1" },
] as const;

export type ReactionKey = (typeof REACTIONS)[number]["key"];

export const REACTION_KEYS = new Set<string>(REACTIONS.map((r) => r.key));

export type ReactionCounts = Partial<Record<ReactionKey, { count: number; viewerHasReacted: boolean }>>;

export interface ThreadUser {
  login: string;
  avatarUrl: string;
  url: string;
}

export interface ThreadComment {
  id: string;
  url: string;
  author: ThreadUser | null;
  /** OWNER | MEMBER | COLLABORATOR | CONTRIBUTOR | NONE ... */
  association: string;
  createdAt: string;
  editedAt: string | null;
  body: string;
  html: string;
  reactions: ReactionCounts;
  viewerCanUpdate: boolean;
  viewerCanDelete: boolean;
  minimized: boolean;
}

export interface Thread {
  issueId: string;
  issueNumber: number;
  url: string;
  locked: boolean;
  reactions: ReactionCounts;
  comments: ThreadComment[];
  totalComments: number;
}

export interface Viewer {
  login: string;
  avatarUrl: string;
  name: string | null;
}
