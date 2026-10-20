"use client";

import dynamic from "next/dynamic";
import type { WriterProps } from "./Writer";

/**
 * The editor reads drafts from localStorage on its first render, so it only
 * ever renders in the browser. The skeleton matches the header's geometry.
 */
const Writer = dynamic(() => import("./Writer"), {
  ssr: false,
  loading: () => (
    <div className="px-5 sm:px-6" aria-busy="true">
      <div className="measure animate-pulse pt-10 sm:pt-14">
        <div className="aspect-[48/9] rounded-2xl border border-line bg-elev/70" />
        <div className="mt-14 h-10 w-3/4 rounded-lg bg-subtle" />
        <div className="mt-5 h-5 w-1/2 rounded bg-subtle" />
      </div>
    </div>
  ),
});

export function WriterLoader(props: WriterProps) {
  return <Writer {...props} />;
}
