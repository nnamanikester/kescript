"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

/** Fire-and-forget toast from anywhere: toast("Link copied"). */
export function toast(message: string) {
  window.dispatchEvent(new CustomEvent("ks-toast", { detail: message }));
}

/**
 * Page-wide behaviour that would otherwise need a listener per element:
 *  - [data-spotlight] cards get a glow that follows the cursor (--mx / --my)
 *  - clicking a heading's "#" copies a deep link instead of jumping
 *  - a single toast region for confirmations
 */
export function Enhancers() {
  const [message, setMessage] = useState<{ text: string; id: number } | null>(null);

  useEffect(() => {
    let current: HTMLElement | null = null;
    const onMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-spotlight]") ?? null;
      if (current && current !== el) current.style.removeProperty("--spot");
      current = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
      el.style.setProperty("--spot", "1");
    };

    const onClick = async (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>("a.heading-anchor");
      if (!anchor || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      const url = new URL(anchor.href, window.location.href).toString();
      history.replaceState(null, "", url);
      anchor.closest("h2, h3, h4")?.scrollIntoView({ behavior: "smooth", block: "start" });
      try {
        await navigator.clipboard.writeText(url);
        toast("Link to section copied");
      } catch {
        /* the URL is in the address bar regardless */
      }
    };

    const onToast = (e: Event) => setMessage({ text: (e as CustomEvent<string>).detail, id: Date.now() });

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("click", onClick);
    window.addEventListener("ks-toast", onToast);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("click", onClick);
      window.removeEventListener("ks-toast", onToast);
    };
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 2200);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[95] flex justify-center px-4">
      {message && (
        <div
          key={message.id}
          className="toast-in flex items-center gap-2 rounded-full border border-line-strong bg-elev/95 px-4 py-2 text-sm text-fg shadow-card backdrop-blur"
        >
          <Check className="h-3.5 w-3.5 text-ok" />
          {message.text}
        </div>
      )}
    </div>
  );
}
