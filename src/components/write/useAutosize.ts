"use client";

import { useLayoutEffect, type RefObject } from "react";

/** Grow a textarea with its content (field-sizing isn't in every browser yet). */
export function useAutosize(ref: RefObject<HTMLTextAreaElement | null>, value: string) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [ref, value]);
}
