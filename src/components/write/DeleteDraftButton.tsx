"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "@/components/site/Enhancers";
import { DELETE_CONFIRM, deletedMessage, requestDeleteDraft } from "./deleteDraft";

/** The trash can on a /write/drafts row. */
export function DeleteDraftButton({ number, title }: { number: number; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!confirm(`${title ? `“${title}”\n\n` : ""}${DELETE_CONFIRM}`)) return;
        setBusy(true);
        try {
          toast(deletedMessage(await requestDeleteDraft(number)));
          // Keep the spinner until the refreshed list replaces this row.
          router.refresh();
        } catch (e) {
          toast((e as Error).message);
          setBusy(false);
        }
      }}
      aria-label={`Delete draft ${title || number}`}
      title="Delete draft"
      className="grid h-6 w-6 place-items-center rounded-full text-faint transition-colors hover:bg-danger/10 hover:text-danger disabled:cursor-wait"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  );
}
