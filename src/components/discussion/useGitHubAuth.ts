"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Viewer } from "@/lib/reactions";

/** Fired after sign-in/out so every auth-aware component on the page agrees. */
export const AUTH_CHANGED = "ks-auth-changed";

interface AuthState {
  configured: boolean;
  viewer: Viewer | null;
  ready: boolean;
}

/**
 * Sign-in via a popup so the reader keeps their scroll position and draft.
 * `signIn(then)` runs `then` once GitHub hands back a session — e.g. post the
 * comment they already wrote, or apply the reaction they clicked.
 */
export function useGitHubAuth() {
  const [state, setState] = useState<AuthState>({ configured: false, viewer: null, ready: false });
  const pending = useRef<(() => void) | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await res.json()) as { configured: boolean; viewer: Viewer | null };
      setState({ ...data, ready: true });
      return data.viewer;
    } catch {
      setState((s) => ({ ...s, ready: true }));
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { configured: boolean; viewer: Viewer | null }) => !cancelled && setState({ ...data, ready: true }))
      .catch(() => !cancelled && setState((s) => ({ ...s, ready: true })));

    const onMessage = async (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "ks-auth") return;
      if (!e.data.ok) {
        pending.current = null;
        return;
      }
      const viewer = await refresh();
      window.dispatchEvent(new Event(AUTH_CHANGED));
      if (viewer && pending.current) {
        const run = pending.current;
        pending.current = null;
        run();
      }
    };
    const onChanged = () => void refresh();
    window.addEventListener("message", onMessage);
    window.addEventListener(AUTH_CHANGED, onChanged);
    return () => {
      cancelled = true;
      window.removeEventListener("message", onMessage);
      window.removeEventListener(AUTH_CHANGED, onChanged);
    };
  }, [refresh]);

  const signIn = useCallback((then?: () => void, returnTo = `${window.location.pathname}#discussion`) => {
    pending.current = then ?? null;
    const url = `/api/auth/login?popup=1&returnTo=${encodeURIComponent(returnTo)}`;
    const w = 520;
    const h = 720;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2.5;
    const popup = window.open(url, "github-sign-in", `width=${w},height=${h},left=${left},top=${top}`);
    // Popup blocked: fall back to a full redirect (the draft is in localStorage).
    if (!popup) window.location.href = url.replace("popup=1&", "");
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setState((s) => ({ ...s, viewer: null }));
    window.dispatchEvent(new Event(AUTH_CHANGED));
  }, []);

  /** A write came back 401: the token expired or was revoked. */
  const expire = useCallback(() => setState((s) => ({ ...s, viewer: null })), []);

  return { ...state, signIn, signOut, refresh, expire };
}
