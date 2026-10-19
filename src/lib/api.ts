import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { GitHubError, threadTag } from "@/lib/github";
import { POSTS_TAG } from "@/lib/content";
import { getSession, isSameOrigin, SESSION_COOKIE, type Session } from "@/lib/session";

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return NextResponse.json(data, { status, headers });
}

export function parseIssue(param: string): number | null {
  const n = Number(param);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Guard for every write: same origin, signed in, and GitHub errors mapped to something a UI can act on. */
export async function withViewer(req: Request, fn: (session: Session) => Promise<Response>): Promise<Response> {
  if (!isSameOrigin(req)) return json({ error: "forbidden", message: "Cross-site request blocked" }, 403);
  const session = await getSession();
  if (!session) return json({ error: "auth", message: "Sign in with GitHub to continue" }, 401);
  try {
    return await fn(session);
  } catch (err) {
    if (err instanceof GitHubError) {
      if (err.status === 401) {
        const res = json({ error: "auth", message: "Your GitHub session expired — sign in again" }, 401);
        res.cookies.delete(SESSION_COOKIE);
        return res;
      }
      if (err.status === 403) {
        return json(
          { error: "forbidden", message: "GitHub refused that action. The issue may be locked, or the app lacks access." },
          403,
        );
      }
      return json({ error: "github", message: err.message }, 502);
    }
    console.error(err);
    return json({ error: "server", message: "Something went wrong" }, 500);
  }
}

/** After a write, the cached public thread (and comment counts) must not be served stale. */
export function invalidateThread(issueNumber: number) {
  revalidateTag(threadTag(issueNumber), { expire: 0 });
  revalidateTag(POSTS_TAG, "max");
}

export const MAX_COMMENT_LENGTH = 65_536;

export async function readBody<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
