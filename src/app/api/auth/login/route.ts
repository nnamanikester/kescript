import { NextResponse, type NextRequest } from "next/server";
import { authConfigured, seal, STATE_COOKIE } from "@/lib/session";

/**
 * Starts "Sign in with GitHub". Works with a GitHub App (recommended: it can
 * only touch issues in the repos it is installed on) or a classic OAuth App
 * (set GITHUB_OAUTH_SCOPE=public_repo).
 */
export async function GET(req: NextRequest) {
  if (!authConfigured()) {
    return NextResponse.json({ error: "GitHub sign-in is not configured" }, { status: 501 });
  }
  const url = new URL(req.url);
  const returnTo = url.searchParams.get("returnTo") ?? "/";
  const state = crypto.randomUUID();

  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID!);
  authorize.searchParams.set("redirect_uri", `${url.origin}/api/auth/callback`);
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("allow_signup", "true");
  if (process.env.GITHUB_OAUTH_SCOPE) authorize.searchParams.set("scope", process.env.GITHUB_OAUTH_SCOPE);

  const res = NextResponse.redirect(authorize);
  res.cookies.set(
    STATE_COOKIE,
    await seal({ state, returnTo: returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/", popup: url.searchParams.has("popup") }),
    { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/auth", maxAge: 600 },
  );
  return res;
}
