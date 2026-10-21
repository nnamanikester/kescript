import Image from "next/image";
import { isOptimizable } from "@/lib/image-hosts";
import { PostArt } from "./PostArt";

/**
 * A post's picture: its featured image when it has one, otherwise the
 * generated art. The wrapper sets the shape (aspect ratio); the image fills it.
 */
export function PostCover({ slug, image, className = "", sizes }: { slug: string; image?: string; className?: string; sizes: string }) {
  if (!image) return <PostArt slug={slug} className={`block w-full ${className}`} />;
  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <Image src={image} alt="" fill sizes={sizes} unoptimized={!isOptimizable(image)} className="object-cover" />
    </div>
  );
}
