"use client";

const MAX_EDGE = 2400;
const RESIZE_OVER_BYTES = 1.5 * 1024 * 1024;

/**
 * Big photos are scaled to 2400px and re-encoded as WebP before upload, so
 * posts stay fast and requests stay under Vercel's body limit. GIFs are left
 * alone (re-encoding would drop the animation).
 */
async function shrink(file: File): Promise<File> {
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= RESIZE_OVER_BYTES) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
}

export async function uploadImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't an image");
  const body = new FormData();
  body.set("file", await shrink(file));
  const res = await fetch("/api/write/upload", { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
  if (!res.ok || !data.url) throw new Error(data.message ?? `Upload failed (${res.status})`);
  return data.url;
}

export function imageFiles(list: FileList | File[] | null | undefined): File[] {
  return [...(list ?? [])].filter((f) => f.type.startsWith("image/"));
}
