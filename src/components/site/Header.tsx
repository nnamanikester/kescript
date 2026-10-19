"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { NAV } from "@/lib/site";
import { ThemeToggle } from "./ThemeToggle";
import { OPEN_PALETTE } from "./CommandPalette";

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2 font-mono text-[0.9rem] text-fg" aria-label="kescript, home">
      <span className="grid h-6 w-6 place-items-center rounded-md bg-fg text-[0.7rem] font-bold text-bg transition-colors group-hover:bg-accent">
        k
      </span>
      <span>
        kescript<span className="text-accent">_</span>
      </span>
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/") || (href === "/blog" && pathname.startsWith("/tags"));
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openPalette = () => window.dispatchEvent(new Event(OPEN_PALETTE));

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors ${
        scrolled || open ? "border-line bg-bg/80 backdrop-blur-xl" : "border-transparent bg-bg"
      }`}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-elev focus:px-3 focus:py-1.5 focus:text-sm">
        Skip to content
      </a>
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-5 sm:px-6">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={`rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                isActive(pathname, item.href) ? "text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={openPalette}
            className="hidden h-8 items-center gap-2 rounded-lg border border-line bg-elev pl-2.5 pr-1.5 text-sm text-faint transition-colors hover:border-line-strong hover:text-muted sm:flex"
            aria-label="Search (Command K)"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="pr-6">Search</span>
            <kbd>⌘K</kbd>
          </button>
          <button
            type="button"
            onClick={openPalette}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-hover hover:text-fg sm:hidden"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-hover hover:text-fg md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Mobile" className="border-t border-line px-5 pb-5 pt-2 md:hidden animate-fade-up">
          {NAV.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between border-b border-line py-3.5 text-base text-fg"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {item.label}
              <span className="font-mono text-xs text-faint">{item.href}</span>
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
