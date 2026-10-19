"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-24 sm:px-6">
      <p className="font-mono text-xs text-faint">
        <span className="text-danger">500</span> · something broke
      </p>
      <h1 className="mt-3 text-[2.4rem] font-semibold tracking-[-0.035em] text-fg">That wasn&apos;t supposed to happen.</h1>
      <p className="mt-4 text-[1.0625rem] text-muted">
        The error has been logged{error.digest ? <> as <code className="font-mono text-sm">{error.digest}</code></> : null}.
      </p>
      <button type="button" onClick={reset} className="mt-8 h-10 rounded-lg bg-fg px-4 text-sm font-medium text-bg hover:opacity-90">
        Try again
      </button>
    </div>
  );
}
