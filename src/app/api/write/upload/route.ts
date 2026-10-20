import { json, withOwner } from "@/lib/api";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, uploadImage } from "@/lib/write";

/** Image upload for the editor. The client resizes first, so this stays under Vercel's 4.5 MB body limit. */
export async function POST(req: Request) {
  return withOwner(req, async (session) => {
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return json({ error: "invalid", message: "No image received" }, 400);
    const ext = IMAGE_TYPES[file.type];
    if (!ext) return json({ error: "invalid", message: "Use PNG, JPEG, WebP, GIF or AVIF" }, 415);
    if (file.size > MAX_IMAGE_BYTES) return json({ error: "invalid", message: "Images must be under 4 MB" }, 413);
    const url = await uploadImage(session.token, Buffer.from(await file.arrayBuffer()), ext);
    return json({ url }, 201);
  });
}
