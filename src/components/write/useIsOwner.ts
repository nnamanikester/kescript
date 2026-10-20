"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether to show author-only buttons. Reads the readable `ks_owner` hint
 * cookie set at sign-in; the server re-checks the real session on every write.
 */
const read = () => /(?:^|;\s*)ks_owner=1(?:;|$)/.test(document.cookie);
const subscribe = (cb: () => void) => {
  // Popup sign-in returns focus to the page; sign-out announces itself.
  window.addEventListener("focus", cb);
  window.addEventListener("ks-auth-changed", cb);
  return () => {
    window.removeEventListener("focus", cb);
    window.removeEventListener("ks-auth-changed", cb);
  };
};

export function useIsOwner(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
