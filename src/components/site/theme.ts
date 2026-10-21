export type ThemePref = "light" | "dark" | "system";

export const THEME_KEY = "theme";

/** Runs before first paint (inlined in <head>), so there is never a flash of the wrong theme. */
export const themeScript = `(() => {
  try {
    var p = localStorage.getItem("${THEME_KEY}") || "system";
    var dark = p === "dark" || (p === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.dataset.themePref = p;
  } catch (e) { document.documentElement.dataset.theme = "dark"; }
})();`;

/**
 * Switch theme. With an origin (the toggle's position) and a browser that
 * supports view transitions, the new theme grows out of that point as a
 * circle; otherwise it switches instantly.
 */
export function applyTheme(pref: ThemePref, origin?: { x: number; y: number }) {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  // A hidden tab can't animate; Chrome would reject the transition.
  if (origin && doc.startViewTransition && !reduced && document.visibilityState === "visible") {
    const r = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y));
    root.style.setProperty("--reveal-x", `${origin.x}px`);
    root.style.setProperty("--reveal-y", `${origin.y}px`);
    root.style.setProperty("--reveal-r", `${r}px`);
    root.classList.add("theme-reveal");
    doc.startViewTransition(() => setTheme(pref)).finished.finally(() => root.classList.remove("theme-reveal"));
    return;
  }
  setTheme(pref);
}

function setTheme(pref: ThemePref) {
  const root = document.documentElement;
  const dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.add("theme-switching");
  root.dataset.theme = dark ? "dark" : "light";
  root.dataset.themePref = pref;
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event("themechange"));
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
}

export function readThemePref(): ThemePref {
  return (document.documentElement.dataset.themePref as ThemePref) ?? "system";
}
