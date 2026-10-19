"use client";

import { useEffect, useId, useState } from "react";

/** Mermaid is ~1MB, so it only loads on posts that actually contain a diagram. */
export function Mermaid({ "data-chart": chart = "" }: { "data-chart"?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setTheme(root.dataset.theme ?? "light");
    read();
    const obs = new MutationObserver(read);
    obs.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!theme) return;
    let cancelled = false;
    import("mermaid").then(async ({ default: mermaid }) => {
      const css = getComputedStyle(document.documentElement);
      const v = (name: string) => css.getPropertyValue(name).trim();
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        fontFamily: v("--font-geist-mono") || "ui-monospace",
        themeVariables: {
          darkMode: theme === "dark",
          background: v("--code-bg"),
          primaryColor: v("--bg-elev"),
          primaryTextColor: v("--fg"),
          primaryBorderColor: v("--border-strong"),
          lineColor: v("--fg-subtle"),
          secondaryColor: v("--bg-subtle"),
          tertiaryColor: v("--bg-subtle"),
          noteBkgColor: v("--accent-soft"),
          noteBorderColor: v("--accent"),
          fontSize: "13px",
        },
      });
      try {
        const { svg } = await mermaid.render(`mermaid-${id}-${theme}`, chart);
        if (!cancelled) {
          setSvg(svg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [chart, id, theme]);

  return (
    <figure className="mermaid not-prose overflow-x-auto rounded-xl border border-line bg-[var(--code-bg)] p-5">
      {error ? (
        <pre className="font-mono text-xs text-danger whitespace-pre-wrap">Diagram error: {error}</pre>
      ) : svg ? (
        <div className="flex justify-center [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="h-40 animate-pulse rounded-md bg-subtle" aria-label="Loading diagram" />
      )}
    </figure>
  );
}
