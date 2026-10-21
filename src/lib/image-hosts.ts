/**
 * Hosts Next's image optimiser may fetch from. next.config.ts builds
 * remotePatterns from this list, and <PostCover> serves images from any other
 * host as-is rather than letting next/image throw.
 */
export const IMAGE_HOSTS = [
  "avatars.githubusercontent.com",
  "github.com",
  "user-images.githubusercontent.com",
  // The writer's uploads, on the repo's `assets` branch.
  "raw.githubusercontent.com",
  "images.unsplash.com",
] as const;

export function isOptimizable(src: string): boolean {
  try {
    const url = new URL(src);
    return url.protocol === "https:" && (IMAGE_HOSTS as readonly string[]).includes(url.hostname);
  } catch {
    return false;
  }
}
