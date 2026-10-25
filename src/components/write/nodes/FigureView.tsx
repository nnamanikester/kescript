"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { ImagePlus, Loader2, Replace, SlidersHorizontal, Trash2 } from "lucide-react";
import type { UploadFn } from "../extensions";
import { imageFiles } from "../upload";
import { ImageEditor } from "../ImageEditor";
import { AttrInput } from "./AttrInput";
import { clampWidth } from "@/lib/markdown/image-width";

export function FigureView({ node, updateAttributes, deleteNode, selected, extension }: NodeViewProps) {
  const { src, alt, caption, width } = node.attrs as { src: string; alt: string; caption: string; width: number | null };
  const upload = (extension.options as { upload: UploadFn | null }).upload;
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [showAlt, setShowAlt] = useState(false);
  // Typing the first letter fills `alt`, which would hide a box shown only because alt was empty.
  const [altFocused, setAltFocused] = useState(false);
  const [editing, setEditing] = useState(false);
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const pending = busy || src.startsWith("blob:");
  const shownWidth = dragWidth ?? width ?? 100;

  // Drag either side handle; the image stays centred, so it grows by twice the drag.
  const startResize = (e: ReactPointerEvent<HTMLElement>, side: 1 | -1) => {
    const handle = e.currentTarget;
    const frame = handle.parentElement;
    const column = frame?.parentElement?.getBoundingClientRect().width;
    if (!frame || !column) return;
    e.preventDefault();
    e.stopPropagation();
    handle.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startWidth = (frame.getBoundingClientRect().width / column) * 100;
    let next = width ?? 100;
    const move = (ev: PointerEvent) => {
      next = clampWidth(startWidth + ((ev.clientX - startX) * side * 2 * 100) / column) ?? 100;
      setDragWidth(next);
    };
    const up = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      handle.removeEventListener("pointercancel", up);
      setDragWidth(null);
      updateAttributes({ width: next >= 100 ? null : next });
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
    handle.addEventListener("pointercancel", up);
  };

  const take = async (files: File[]) => {
    const file = files[0];
    if (!file || !upload) return;
    setError(null);
    setBusy(true);
    const preview = URL.createObjectURL(file);
    const previous = src;
    updateAttributes({ src: preview });
    try {
      updateAttributes({ src: await upload(file) });
    } catch (e) {
      updateAttributes({ src: previous });
      setError((e as Error).message);
    } finally {
      URL.revokeObjectURL(preview);
      setBusy(false);
    }
  };

  const picker = (
    <input
      ref={fileRef}
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
      className="hidden"
      onChange={(e) => {
        void take(imageFiles(e.target.files));
        e.target.value = "";
      }}
    />
  );

  if (!src) {
    return (
      <NodeViewWrapper as="figure" data-image="" className="writer-figure">
        <div
          contentEditable={false}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void take(imageFiles(e.dataTransfer.files));
          }}
          className={`flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-colors ${
            selected ? "border-accent bg-accent/5" : "border-line-strong bg-subtle/60"
          }`}
        >
          {picker}
          <ImagePlus className="h-6 w-6 text-faint" aria-hidden />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-full bg-fg px-4 py-1.5 text-sm font-medium text-bg transition-transform active:scale-[0.98]"
          >
            Upload an image
          </button>
          <p className="text-xs text-faint">drop a file here, or paste a link</p>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && /^https?:\/\//.test(url.trim())) {
                e.preventDefault();
                updateAttributes({ src: url.trim() });
              }
            }}
            placeholder="https://… then Enter"
            className="w-full max-w-sm rounded-lg border border-line bg-elev px-3 py-1.5 text-center font-mono text-xs text-fg outline-none focus:border-line-strong"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper as="figure" data-image="" className={`writer-figure ${selected ? "is-selected" : ""}`}>
      {picker}
      <div
        contentEditable={false}
        className="group/fig relative mx-auto w-fit max-w-full"
        style={shownWidth < 100 ? { width: `${shownWidth}%` } : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} data-drag-handle="" className={`${shownWidth < 100 ? "w-full" : ""} ${pending ? "opacity-60" : ""}`} />
        {!pending &&
          ([-1, 1] as const).map((side) => (
            <span
              key={side}
              role="separator"
              aria-label="Drag to resize"
              title="Drag to resize · double-click for full width"
              onPointerDown={(e) => startResize(e, side)}
              onDoubleClick={() => updateAttributes({ width: null })}
              className={`absolute top-1/2 h-12 w-1.5 -translate-y-1/2 cursor-ew-resize touch-none rounded-full border border-line bg-elev opacity-0 shadow-card transition-opacity group-hover/fig:opacity-100 ${
                side === -1 ? "left-1.5" : "right-1.5"
              } ${dragWidth !== null ? "opacity-100" : ""}`}
            />
          ))}
        {dragWidth !== null && (
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-bg/90 px-2.5 py-1 font-mono text-[0.7rem] text-muted shadow-card">
            {dragWidth}%
          </span>
        )}
        {pending && (
          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-bg/90 px-2.5 py-1 font-mono text-[0.7rem] text-muted shadow-card">
            <Loader2 className="h-3 w-3 animate-spin" /> uploading
          </span>
        )}
        {!pending && (
          <div className="absolute right-2 top-2 flex gap-1 rounded-lg border border-line bg-elev/95 p-1 opacity-0 shadow-card backdrop-blur transition-opacity group-hover/fig:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              onClick={() => setShowAlt((s) => !s)}
              className={`h-7 rounded-md px-2 font-mono text-[0.7rem] hover:bg-hover ${alt ? "text-ok" : "text-faint"}`}
              title="Alt text, for screen readers"
            >
              ALT
            </button>
            {upload && (
              <button type="button" onClick={() => setEditing(true)} className="grid h-7 w-7 place-items-center rounded-md text-faint hover:bg-hover hover:text-fg" aria-label="Edit image" title="Edit: crop, draw, hide parts">
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </button>
            )}
            <button type="button" onClick={() => fileRef.current?.click()} className="grid h-7 w-7 place-items-center rounded-md text-faint hover:bg-hover hover:text-fg" aria-label="Replace image">
              <Replace className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={deleteNode} className="grid h-7 w-7 place-items-center rounded-md text-faint hover:bg-hover hover:text-danger" aria-label="Remove image">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      {(showAlt || altFocused || (selected && !alt)) && (
        <AttrInput
          value={alt}
          onCommit={(next) => updateAttributes({ alt: next })}
          onFocus={() => setAltFocused(true)}
          onBlur={() => setAltFocused(false)}
          placeholder="Alt text — describe the image for someone who can't see it"
          className="mt-2 w-full rounded-lg border border-line bg-elev px-3 py-1.5 text-sm text-fg outline-none focus:border-line-strong"
        />
      )}
      <AttrInput
        value={caption}
        onCommit={(next) => updateAttributes({ caption: next })}
        placeholder="Add a caption (optional)"
        aria-label="Caption"
        className="writer-caption"
      />
      {error && <p className="mt-1 text-center text-xs text-danger">{error}</p>}
      {editing && upload && (
        <ImageEditor
          src={src}
          onClose={() => setEditing(false)}
          onSave={async (file) => {
            updateAttributes({ src: await upload(file) });
            setEditing(false);
          }}
        />
      )}
    </NodeViewWrapper>
  );
}
