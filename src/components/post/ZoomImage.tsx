"use client";

import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { createPortal } from "react-dom";

/** Click an image to see it full-size; Esc or click to close. */
export function ZoomImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const { alt = "", ...rest } = props;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...rest}
        alt={alt}
        loading="lazy"
        decoding="async"
        onClick={(e) => {
          // Linked images navigate instead of zooming.
          if (!e.currentTarget.closest("a")) setOpen(true);
        }}
        className="[:not(a)>&]:cursor-zoom-in"
      />
      {open &&
        createPortal(
          <div
            role="dialog"
            aria-label={alt || "Image"}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[100] grid cursor-zoom-out place-items-center bg-bg/90 p-4 backdrop-blur-md animate-fade-up sm:p-10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={props.src as string} alt={alt} className="max-h-full max-w-full rounded-lg border border-line shadow-card" />
          </div>,
          document.body,
        )}
    </>
  );
}
