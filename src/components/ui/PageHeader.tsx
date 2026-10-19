import type { ReactNode } from "react";

/** Every page opens the same way: a mono path, a title, a lede. */
export function PageHeader({ path, title, children }: { path: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="relative pb-10 pt-16 sm:pt-20">
      <div className="bg-grid pointer-events-none absolute inset-x-0 -top-14 bottom-0 -z-10 opacity-70" aria-hidden />
      <p className="font-mono text-xs text-faint">
        <span className="text-accent">~</span>/{path}
      </p>
      <h1 className="mt-3 text-[2.1rem] font-semibold leading-[1.1] tracking-[-0.035em] text-fg sm:text-[2.6rem]">{title}</h1>
      {children && <div className="mt-4 max-w-[60ch] text-[1.0625rem] leading-relaxed text-muted">{children}</div>}
    </header>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-line pb-3">
      <h2 className="label">{children}</h2>
      {action}
    </div>
  );
}
