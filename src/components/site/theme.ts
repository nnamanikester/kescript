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

export function applyTheme(pref: ThemePref) {
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
