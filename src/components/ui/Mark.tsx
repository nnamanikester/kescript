/** The KeScript mark — same geometry as public/favicon.svg. Inverts with the theme via tokens. */
export function Mark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" className="fill-fg transition-colors" />
      <path className="fill-bg" d="M6 6h4v11l6-6h5.66l-7.5 7.5 7.5 7.5H16l-4.67-4.67L10 22.66V26H6z" />
      <rect x="24" y="24" width="4" height="2" className="fill-accent" />
    </svg>
  );
}
