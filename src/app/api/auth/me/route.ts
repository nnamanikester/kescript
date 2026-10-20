import { NextResponse, type NextRequest } from "next/server";
import { GH } from "@/lib/site";
import { authConfigured, getSession, OWNER_COOKIE, sessionCookieOptions } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const res = NextResponse.json(
    {
      configured: authConfigured(),
      viewer: session ? { login: session.login, avatarUrl: session.avatarUrl, name: session.name } : null,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
  // Keep the UI hint in step with the session (e.g. sessions from before the hint existed).
  const owner = Boolean(session && (GH.approvedPosters as readonly string[]).includes(session.login));
  const hinted = req.cookies.has(OWNER_COOKIE);
  if (owner && !hinted) res.cookies.set(OWNER_COOKIE, "1", { ...sessionCookieOptions, httpOnly: false });
  if (!owner && hinted) res.cookies.delete(OWNER_COOKIE);
  return res;
}
