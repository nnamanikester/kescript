"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Files, LogOut, PenLine } from "lucide-react";
import { GitHubIcon } from "@/components/ui/brand-icons";
import { useGitHubAuth } from "@/components/discussion/useGitHubAuth";
import { useIsOwner } from "@/components/write/useIsOwner";

/**
 * Sign in / sign out, in the header. Readers sign in to comment and react;
 * the author also gets the writing shortcuts.
 */
export function AccountMenu() {
  const { ready, configured, viewer, signIn, signOut } = useGitHubAuth();
  const owner = useIsOwner();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (!ready || !configured) return null;

  if (!viewer) {
    return (
      <button
        type="button"
        // Server-rendered pages that depend on the session (like /write) re-render once signed in.
        onClick={() => signIn(() => router.refresh(), pathname)}
        aria-label="Sign in with GitHub"
        title="Sign in with GitHub"
        className="flex h-8 items-center gap-1.5 rounded-full px-2 text-[0.84rem] text-muted transition-colors hover:bg-hover hover:text-fg sm:px-3"
      >
        <GitHubIcon className="h-4 w-4" />
        <span className="hidden lg:inline">Sign in</span>
      </button>
    );
  }

  const item = "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-muted transition-colors hover:bg-hover hover:text-fg";

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Signed in as ${viewer.login}`}
        className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-hover"
      >
        <Image src={viewer.avatarUrl} alt="" width={24} height={24} className="h-6 w-6 rounded-full border border-line" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-line bg-elev/95 p-1.5 shadow-card backdrop-blur-xl animate-fade-up">
          <p className="px-2.5 pb-2 pt-1.5 text-xs text-faint">
            Signed in as <span className="font-mono text-muted">@{viewer.login}</span>
          </p>
          {owner && (
            <>
              <Link href="/write" role="menuitem" onClick={() => setOpen(false)} className={item}>
                <PenLine className="h-4 w-4" /> Write a post
              </Link>
              <Link href="/write/drafts" role="menuitem" onClick={() => setOpen(false)} className={item}>
                <Files className="h-4 w-4" /> Drafts &amp; posts
              </Link>
              <div className="my-1 h-px bg-line" />
            </>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await signOut();
              router.refresh();
            }}
            className={item}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
