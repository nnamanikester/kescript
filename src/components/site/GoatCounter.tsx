"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

declare global {
  interface Window {
    goatcounter?: { count: (vars: { path: string }) => void };
  }
}

/** The author's own screens aren't readership. */
const SKIP = /^\/(write|api)(\/|$)/;
let last: string | null = null;

function count(path: string) {
  if (path === last || SKIP.test(path) || !window.goatcounter?.count) return;
  last = path;
  window.goatcounter.count({ path });
}

/**
 * count.js only sees the first page load, so client-side navigations are
 * counted by hand. The path is passed explicitly: by default GoatCounter
 * would use a post's canonical URL, which can point at another site.
 */
export function GoatCounter({ code }: { code: string }) {
  const pathname = usePathname();
  // Before the script loads this is a no-op; onLoad counts the landing page.
  useEffect(() => count(pathname), [pathname]);
  return (
    <Script
      src="https://gc.zgo.at/count.js"
      data-goatcounter={`https://${code}.goatcounter.com/count`}
      data-goatcounter-settings='{"no_onload": true}'
      onLoad={() => count(window.location.pathname)}
    />
  );
}
