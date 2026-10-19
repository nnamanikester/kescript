import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/github";
import { seal, sessionCookieOptions, SESSION_COOKIE, STATE_COOKIE, unseal, type Session } from "@/lib/session";

interface OAuthState {
  state: string;
  returnTo: string;
  popup: boolean;
}

/** In popup mode, hand the result to the opener and close; the reader never leaves the post. */
function popupResponse(origin: string, ok: boolean, message?: string) {
  const payload = JSON.stringify({ type: "ks-auth", ok, message: message ?? null });
  const html = `<!doctype html><meta charset="utf-8"><title>Signing in…</title>
<body style="font:14px system-ui;display:grid;place-items:center;height:100vh;margin:0">
<p>${ok ? "Signed in. You can close this window." : "Sign-in failed. You can close this window."}</p>
<script>
  try { window.opener && window.opener.postMessage(${payload}, ${JSON.stringify(origin)}); } catch (e) {}
  window.close();
</script></body>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const saved = await unseal<OAuthState>(req.cookies.get(STATE_COOKIE)?.value);
  const code = url.searchParams.get("code");
  const popup = saved?.popup ?? false;

  const fail = (message: string) => {
    const res = popup
      ? popupResponse(url.origin, false, message)
      : NextResponse.redirect(new URL(`${saved?.returnTo ?? "/"}?auth_error=${encodeURIComponent(message)}`, url.origin));
    res.cookies.delete({ name: STATE_COOKIE, path: "/api/auth" });
    return res;
  };

  if (!saved || !code || url.searchParams.get("state") !== saved.state) return fail("Sign-in expired, please try again");

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/api/auth/callback`,
    }),
    cache: "no-store",
  });
  const tokenJson = (await tokenRes.json()) as { access_token?: string; error_description?: string };
  if (!tokenJson.access_token) return fail(tokenJson.error_description ?? "GitHub did not return a token");

  let session: Session;
  try {
    const viewer = await getViewer(tokenJson.access_token);
    session = { ...viewer, token: tokenJson.access_token };
  } catch {
    return fail("Could not read your GitHub profile");
  }

  const res = popup ? popupResponse(url.origin, true) : NextResponse.redirect(new URL(saved.returnTo, url.origin));
  res.cookies.set(SESSION_COOKIE, await seal(session), sessionCookieOptions);
  res.cookies.delete({ name: STATE_COOKIE, path: "/api/auth" });
  return res;
}
