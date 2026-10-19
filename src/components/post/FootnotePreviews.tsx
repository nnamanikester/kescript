"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Preview {
  html: string;
  top: number;
  left: number;
  below: boolean;
}

/**
 * Hover (or focus) a footnote marker to read the note in place, instead of
 * jumping to the bottom of the page and back.
 */
export function FootnotePreviews({ rootId }: { rootId: string }) {
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const show = (ref: HTMLAnchorElement) => {
      clearTimeout(hideTimer);
      const id = decodeURIComponent(ref.hash.slice(1));
      const note = document.getElementById(id);
      if (!note) return;
      const clone = note.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("[data-footnote-backref]").forEach((b) => b.remove());
      const r = ref.getBoundingClientRect();
      const below = r.top < 180;
      setPreview({
        html: clone.innerHTML,
        top: below ? r.bottom + 10 : r.top - 10,
        // Keep the whole tooltip on screen: clamp its centre by half its width.
        left: (() => {
          const half = Math.min(176, (innerWidth - 32) / 2);
          return Math.min(Math.max(16 + half, r.left + r.width / 2), innerWidth - 16 - half);
        })(),
        below,
      });
    };
    const hide = () => {
      hideTimer = setTimeout(() => setPreview(null), 120);
    };

    const refs = [...root.querySelectorAll<HTMLAnchorElement>("a[data-footnote-ref]")];
    const handlers = refs.map((ref) => {
      const enter = () => show(ref);
      ref.addEventListener("mouseenter", enter);
      ref.addEventListener("focus", enter);
      ref.addEventListener("mouseleave", hide);
      ref.addEventListener("blur", hide);
      return () => {
        ref.removeEventListener("mouseenter", enter);
        ref.removeEventListener("focus", enter);
        ref.removeEventListener("mouseleave", hide);
        ref.removeEventListener("blur", hide);
      };
    });
    addEventListener("scroll", hide, { passive: true });
    return () => {
      handlers.forEach((off) => off());
      removeEventListener("scroll", hide);
      clearTimeout(hideTimer);
    };
  }, [rootId]);

  if (!preview) return null;
  return createPortal(
    <div
      role="tooltip"
      className="toast-in pointer-events-none fixed z-[90] w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-line-strong bg-elev/95 p-3.5 text-sm leading-relaxed text-muted shadow-card backdrop-blur-xl [&_p]:m-0"
      style={{
        top: preview.top,
        left: preview.left,
        transform: `translate(-50%, ${preview.below ? "0" : "-100%"})`,
      }}
      dangerouslySetInnerHTML={{ __html: preview.html }}
    />,
    document.body,
  );
}
