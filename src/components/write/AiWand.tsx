"use client";

import { useState } from "react";
import { Loader2, WandSparkles } from "lucide-react";
import { toast } from "@/components/site/Enhancers";

/** A small "generate this" button. Errors surface as a toast; the field is left alone. */
export function AiWand({ label, onGenerate, className = "" }: { label: string; onGenerate: () => Promise<void>; className?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onMouseDown={(e) => e.preventDefault()}
      onClick={async () => {
        setBusy(true);
        try {
          await onGenerate();
        } catch (e) {
          toast((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-faint transition-colors hover:bg-hover hover:text-accent disabled:cursor-wait disabled:text-accent ${className}`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
    </button>
  );
}
