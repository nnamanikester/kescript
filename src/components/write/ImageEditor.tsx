"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { Check, Crop, Grid3x3, Loader2, Pencil, RotateCw, Undo2, X } from "lucide-react";

type Tool = "crop" | "pen" | "mask";
type MaskStyle = "pixelate" | "fill";
type Point = { x: number; y: number };
type Box = { x: number; y: number; w: number; h: number };

const COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#111111", "#ffffff"];
const SIZES = [3, 6, 12];
const HISTORY = 20;

function copyOf(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  out.getContext("2d")!.drawImage(canvas, 0, 0);
  return out;
}

function boxFrom(a: Point, b: Point): Box {
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) };
}

/**
 * Full-screen editor for a post image: crop, draw, hide parts, rotate. Edits
 * happen on a full-resolution canvas; Save hands back a new WebP file.
 */
export function ImageEditor({
  src,
  onClose,
  onSave,
}: {
  src: string;
  onClose: () => void;
  onSave: (file: File) => Promise<void>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const history = useRef<HTMLCanvasElement[]>([]);
  const drag = useRef<{ start: Point; last: Point } | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(SIZES[1]);
  const [maskStyle, setMaskStyle] = useState<MaskStyle>("pixelate");
  const [box, setBox] = useState<Box | null>(null);
  const [steps, setSteps] = useState(0);
  const [dims, setDims] = useState({ w: 1, h: 1 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error();
        const bitmap = await createImageBitmap(await res.blob());
        const canvas = canvasRef.current;
        if (cancelled || !canvas) return bitmap.close();
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
        bitmap.close();
        setDims({ w: canvas.width, h: canvas.height });
        setReady(true);
      } catch {
        if (!cancelled) setError("Couldn't open this image for editing. Some sites block it — try uploading the file instead.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    dialogRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const canvas = () => canvasRef.current!;
  const ctx = () => canvas().getContext("2d")!;

  const snapshot = () => {
    history.current = [...history.current.slice(-(HISTORY - 1)), copyOf(canvas())];
    setSteps(history.current.length);
  };

  const replaceWith = (next: HTMLCanvasElement) => {
    const c = canvas();
    c.width = next.width;
    c.height = next.height;
    ctx().drawImage(next, 0, 0);
    setDims({ w: c.width, h: c.height });
  };

  const undo = () => {
    const prev = history.current.pop();
    if (!prev) return;
    replaceWith(prev);
    setBox(null);
    setSteps(history.current.length);
  };

  const rotate = () => {
    snapshot();
    const before = copyOf(canvas());
    const c = canvas();
    c.width = before.height;
    c.height = before.width;
    const g = ctx();
    g.translate(c.width, 0);
    g.rotate(Math.PI / 2);
    g.drawImage(before, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0);
    setDims({ w: c.width, h: c.height });
    setBox(null);
  };

  const applyCrop = () => {
    if (!box || box.w < 2 || box.h < 2) return;
    snapshot();
    const part = document.createElement("canvas");
    part.width = Math.round(box.w);
    part.height = Math.round(box.h);
    part.getContext("2d")!.drawImage(canvas(), box.x, box.y, box.w, box.h, 0, 0, part.width, part.height);
    replaceWith(part);
    setBox(null);
  };

  const applyMask = (b: Box) => {
    if (b.w < 2 || b.h < 2) return;
    snapshot();
    const g = ctx();
    if (maskStyle === "fill") {
      g.fillStyle = color;
      g.fillRect(b.x, b.y, b.w, b.h);
      return;
    }
    // Pixelate: shrink the region to a few blocks, then scale it back up unsmoothed.
    const block = Math.max(8, Math.round(Math.max(b.w, b.h) / 14));
    const tiny = document.createElement("canvas");
    tiny.width = Math.max(1, Math.round(b.w / block));
    tiny.height = Math.max(1, Math.round(b.h / block));
    tiny.getContext("2d")!.drawImage(canvas(), b.x, b.y, b.w, b.h, 0, 0, tiny.width, tiny.height);
    g.imageSmoothingEnabled = false;
    g.drawImage(tiny, 0, 0, tiny.width, tiny.height, b.x, b.y, b.w, b.h);
    g.imageSmoothingEnabled = true;
  };

  /** Pointer position in image pixels, plus how many image pixels one screen pixel covers. */
  const locate = (e: ReactPointerEvent) => {
    const c = canvas();
    const rect = c.getBoundingClientRect();
    const scale = c.width / rect.width;
    return {
      x: Math.min(c.width, Math.max(0, (e.clientX - rect.left) * scale)),
      y: Math.min(c.height, Math.max(0, (e.clientY - rect.top) * scale)),
      scale,
    };
  };

  const stroke = (from: Point, to: Point, scale: number) => {
    const g = ctx();
    g.strokeStyle = color;
    g.lineWidth = size * scale;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.beginPath();
    g.moveTo(from.x, from.y);
    g.lineTo(to.x, to.y);
    g.stroke();
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    if (!ready || saving || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = locate(e);
    drag.current = { start: p, last: p };
    if (tool === "pen") {
      snapshot();
      stroke(p, p, p.scale);
    } else {
      setBox(null);
    }
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = locate(e);
    if (tool === "pen") stroke(d.last, p, p.scale);
    else setBox(boxFrom(d.start, p));
    d.last = p;
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || tool !== "mask") return;
    applyMask(boxFrom(d.start, d.last));
    setBox(null);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas().toBlob(resolve, "image/webp", 0.92));
      if (!blob) throw new Error("Couldn't export the image");
      await onSave(new File([blob], "edited.webp", { type: "image/webp" }));
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  const pickTool = (next: Tool) => {
    setTool(next);
    setBox(null);
  };

  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  const toolButton = (id: Tool, label: string, Icon: typeof Crop) => (
    <button
      type="button"
      onClick={() => pickTool(id)}
      aria-pressed={tool === id}
      className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${
        tool === id ? "bg-fg text-bg" : "text-muted hover:bg-hover hover:text-fg"
      }`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
    </button>
  );

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-label="Edit image"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !saving) onClose();
        else if ((e.metaKey || e.ctrlKey) && e.key === "z") {
          e.preventDefault();
          undo();
        } else if (e.key === "Enter" && tool === "crop" && box) {
          e.preventDefault();
          applyCrop();
        }
      }}
      className="fixed inset-0 z-[100] flex flex-col bg-bg/95 outline-none backdrop-blur-md"
    >
      <div className="flex flex-wrap items-center justify-center gap-2 border-b border-line px-4 py-2.5">
        <div className="flex gap-1 rounded-lg border border-line bg-elev p-1">
          {toolButton("pen", "Draw", Pencil)}
          {toolButton("mask", "Hide", Grid3x3)}
          {toolButton("crop", "Crop", Crop)}
        </div>

        {tool === "mask" && (
          <div className="flex gap-1 rounded-lg border border-line bg-elev p-1">
            {(["pixelate", "fill"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMaskStyle(m)}
                aria-pressed={maskStyle === m}
                className={`h-8 rounded-md px-2.5 text-xs ${maskStyle === m ? "bg-hover text-fg" : "text-muted hover:text-fg"}`}
              >
                {m === "pixelate" ? "Pixelate" : "Solid box"}
              </button>
            ))}
          </div>
        )}

        {(tool === "pen" || (tool === "mask" && maskStyle === "fill")) && (
          <div className="flex items-center gap-1.5 rounded-lg border border-line bg-elev px-2 py-1">
            {COLORS.map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => setColor(col)}
                aria-label={`Colour ${col}`}
                aria-pressed={color === col}
                style={{ background: col }}
                className={`h-5 w-5 rounded-full border border-line-strong ${color === col ? "ring-2 ring-fg ring-offset-2 ring-offset-elev" : ""}`}
              />
            ))}
          </div>
        )}

        {tool === "pen" && (
          <div className="flex gap-1 rounded-lg border border-line bg-elev p-1">
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                aria-label={`Pencil size ${s}`}
                aria-pressed={size === s}
                className={`grid h-8 w-8 place-items-center rounded-md ${size === s ? "bg-hover" : "hover:bg-hover"}`}
              >
                <span className="rounded-full bg-fg" style={{ width: s + 2, height: s + 2 }} />
              </button>
            ))}
          </div>
        )}

        {tool === "crop" && (
          <p className="text-xs text-faint">{box ? "Press Enter or Apply to crop" : "Drag over the part to keep"}</p>
        )}
        {tool === "mask" && <p className="text-xs text-faint">Drag over the part to hide</p>}
      </div>

      <div className="relative grid min-h-0 flex-1 place-items-center overflow-hidden p-4 sm:p-8">
        {!ready && !error && <Loader2 className="absolute h-6 w-6 animate-spin text-faint" aria-label="Loading image" />}
        <div className={`relative overflow-hidden ${ready ? "" : "invisible"}`}>
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={`block max-h-[calc(100dvh-10rem)] max-w-full touch-none select-none rounded-md ${
              tool === "pen" ? "cursor-crosshair" : "cursor-cell"
            }`}
          />
          {box && (
            <div
              className={`pointer-events-none absolute border border-dashed border-white ${
                tool === "crop" ? "shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" : "bg-white/20"
              }`}
              style={{ left: pct(box.x, dims.w), top: pct(box.y, dims.h), width: pct(box.w, dims.w), height: pct(box.h, dims.h) }}
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={undo}
            disabled={!steps || saving}
            className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs text-muted hover:bg-hover hover:text-fg disabled:opacity-40"
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden /> Undo
          </button>
          <button
            type="button"
            onClick={rotate}
            disabled={!ready || saving}
            className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs text-muted hover:bg-hover hover:text-fg disabled:opacity-40"
          >
            <RotateCw className="h-3.5 w-3.5" aria-hidden /> Rotate
          </button>
          {tool === "crop" && box && (
            <button
              type="button"
              onClick={applyCrop}
              className="flex h-8 items-center gap-1.5 rounded-md bg-hover px-2.5 text-xs font-medium text-fg"
            >
              <Crop className="h-3.5 w-3.5" aria-hidden /> Apply crop
            </button>
          )}
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-8 items-center gap-1.5 rounded-full px-3 text-sm text-muted hover:bg-hover hover:text-fg"
          >
            <X className="h-3.5 w-3.5" aria-hidden /> Cancel
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={!ready || !steps || saving}
            className="flex h-8 items-center gap-1.5 rounded-full bg-fg px-4 text-sm font-medium text-bg transition-transform active:scale-[0.98] disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Check className="h-3.5 w-3.5" aria-hidden />}
            {saving ? "Saving" : "Save"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
