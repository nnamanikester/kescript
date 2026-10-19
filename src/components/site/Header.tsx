"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, Search, X } from "lucide-react";
import { NAV, SITE } from "@/lib/site";
import { Mark } from "@/components/ui/Mark";
import { ThemeToggle } from "./ThemeToggle";
import { OPEN_PALETTE } from "./CommandPalette";

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2 font-mono text-[0.9rem] text-fg" aria-label="KeScript, home">
      <Mark className="h-6 w-6 transition-transform duration-300 group-hover:-rotate-6" />
      <span className="hidden sm:inline">
        KeScript<span className="text-accent">_</span>
      </span>
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/") || (href === "/blog" && pathname.startsWith("/tags"));
}

const openPalette = () => window.dispatchEvent(new Event(OPEN_PALETTE));

/** A pill that glides to the hovered link and rests on the current page. */
function PillNav({ pathname }: { pathname: string }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);
  const target = hovered ?? NAV.find((n) => isActive(pathname, n.href))?.href ?? null;

  useLayoutEffect(() => {
    const el = target ? listRef.current?.querySelector<HTMLElement>(`[data-href="${target}"]`) : null;
    const next = el ? { left: el.offsetLeft, width: el.offsetWidth } : null;
    // Measuring layout after render is exactly what a layout effect is for.
    setBox((prev) => (prev?.left === next?.left && prev?.width === next?.width ? prev : next));
  }, [target]);

  return (
    <ul
      ref={listRef}
      onMouseLeave={() => setHovered(null)}
      className="relative flex items-center rounded-full border border-line bg-elev/70 p-1 shadow-card backdrop-blur-xl"
    >
      <span
        aria-hidden
        className="absolute inset-y-1 rounded-full bg-hover transition-[left,width,opacity] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{ left: box?.left ?? 0, width: box?.width ?? 0, opacity: box ? 1 : 0 }}
      />
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href} data-href={item.href} onMouseEnter={() => setHovered(item.href)}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative z-10 block rounded-full px-3.5 py-1.5 text-[0.84rem] transition-colors ${
                active ? "text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {item.label}
              {active && <span className="absolute inset-x-0 -bottom-[3px] mx-auto h-1 w-1 rounded-full bg-accent" aria-hidden />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 pt-3">
      {/* Content dissolves under the floating pills instead of colliding with them. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[5.25rem] bg-[linear-gradient(to_bottom,var(--bg)_58%,transparent)]"
      />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-elev focus:px-3 focus:py-1.5 focus:text-sm"
      >
        Skip to content
      </a>
      <div className="mx-auto grid h-12 max-w-5xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
        <div className="flex">
          <div className="rounded-full border border-line bg-elev/70 p-1 shadow-card backdrop-blur-xl sm:pr-3">
            <Logo />
          </div>
        </div>

        <nav aria-label="Main" className="hidden md:block">
          <PillNav pathname={pathname} />
        </nav>

        <div className="col-start-3 flex justify-end">
          <div className="flex items-center gap-0.5 rounded-full border border-line bg-elev/70 p-1 shadow-card backdrop-blur-xl">
            <button
              type="button"
              onClick={openPalette}
              className="hidden h-8 items-center gap-2 rounded-full pl-3 pr-1.5 text-[0.84rem] text-faint transition-colors hover:bg-hover hover:text-muted sm:flex"
              aria-label="Search (Command K)"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="pr-3">Search</span>
              <kbd className="!rounded-full">⌘K</kbd>
            </button>
            <button
              type="button"
              onClick={openPalette}
              className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-hover hover:text-fg sm:hidden"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <div className="[&_button]:!rounded-full">
              <ThemeToggle />
            </div>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-hover hover:text-fg md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[-1] bg-bg/95 px-6 pt-24 backdrop-blur-xl md:hidden">
          <nav aria-label="Mobile">
            <ul>
              {[{ href: "/", label: "Home" }, ...NAV].map((item, i) => (
                <li key={item.href} className="animate-fade-up" style={{ animationDelay: `${i * 35}ms` }}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className="flex items-baseline justify-between border-b border-line py-4"
                  >
                    <span className={`text-[1.75rem] font-medium tracking-tight ${pathname === item.href ? "text-fg" : "text-muted"}`}>
                      {item.label}
                    </span>
                    <span className="font-mono text-xs text-faint">{item.href}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-8 flex flex-wrap gap-2 animate-fade-up" style={{ animationDelay: "200ms" }}>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openPalette();
              }}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm text-muted"
            >
              <Search className="h-4 w-4" /> Search
            </button>
            <Link
              href="/subscribe"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 items-center rounded-full border border-line px-4 text-sm text-muted"
            >
              Subscribe
            </Link>
            <a href={SITE.links.github} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-4 text-sm text-muted">
              GitHub <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
