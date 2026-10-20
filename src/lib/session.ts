/**
 * Stateless sessions: the reader's GitHub token lives in an AES-GCM sealed,
 * httpOnly cookie. Nothing is stored server-side, so there is nothing to pay for.
 */
import { cookies } from "next/headers";
import type { Viewer } from "@/lib/reactions";

export const SESSION_COOKIE = "ks_session";
export const STATE_COOKIE = "ks_oauth_state";
/**
 * Readable by the page, and only a UI hint ("show the Write button"). It grants
 * nothing: every write is checked against the sealed session on the server.
 */
export const OWNER_COOKIE = "ks_owner";
const MAX_AGE = 60 * 60 * 24 * 30;

export interface Session extends Viewer {
  token: string;
}

let keyPromise: Promise<CryptoKey> | null = null;

function key(): Promise<CryptoKey> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be set (32+ chars)");
  keyPromise ??= crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(secret))
    .then((raw) => crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]));
  return keyPromise;
}

function b64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

export async function seal(data: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify(data));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(), plain));
  const out = new Uint8Array(iv.length + cipher.length);
  out.set(iv);
  out.set(cipher, iv.length);
  return b64url(out);
}

export async function unseal<T>(value: string | undefined): Promise<T | null> {
  if (!value) return null;
  try {
    const bytes = Buffer.from(value, "base64url");
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: bytes.subarray(0, 12) },
      await key(),
      bytes.subarray(12),
    );
    return JSON.parse(new TextDecoder().decode(plain)) as T;
  } catch {
    return null;
  }
}

export function authConfigured(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && process.env.AUTH_SECRET);
}

export async function getSession(): Promise<Session | null> {
  if (!authConfigured()) return null;
  const jar = await cookies();
  return unseal<Session>(jar.get(SESSION_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};

/** Reject cross-site writes. Cookies are SameSite=Lax; this closes the rest. */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
