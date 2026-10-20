import { GitHubIcon } from "@/components/ui/brand-icons";

/** Shown at /write to anyone not signed in. Signed-in readers who aren't the author get a 404. */
export function WriteSignIn({ returnTo, configured }: { returnTo: string; configured: boolean }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-5 py-32 text-center">
      <p className="font-mono text-xs text-faint">
        <span className="text-accent">~</span>/write
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-fg">Author sign-in</h1>
      {configured ? (
        <a
          href={`/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`}
          className="mt-8 inline-flex h-10 items-center gap-2 rounded-full bg-fg px-5 text-sm font-medium text-bg transition-transform active:scale-[0.98]"
        >
          <GitHubIcon className="h-4 w-4" /> Continue with GitHub
        </a>
      ) : (
        <p className="mt-6 text-sm text-muted">GitHub sign-in isn&apos;t configured on this deployment.</p>
      )}
    </div>
  );
}
