"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { applyTheme, readThemePref, type ThemePref } from "./theme";

const ORDER: ThemePref[] = ["system", "light", "dark"];
const ICON = { system: Monitor, light: Sun, dark: Moon };

function subscribe(cb: () => void) {
  window.addEventListener("themechange", cb);
  return () => window.removeEventListener("themechange", cb);
}

export function ThemeToggle() {
  const pref = useSyncExternalStore(subscribe, readThemePref, () => "system" as ThemePref);

  // Follow the OS while on "system".
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => readThemePref() === "system" && applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const next = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
  const Icon = ICON[pref];
  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      aria-label={`Theme: ${pref}. Switch to ${next}`}
      title={`Theme: ${pref}`}
      className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-hover hover:text-fg"
    >
      <Icon className="h-4 w-4" suppressHydrationWarning />
    </button>
  );
}
