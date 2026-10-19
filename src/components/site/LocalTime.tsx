"use client";

import { useEffect, useState } from "react";

const TZ = "Europe/Lisbon";

function now() {
  const d = new Date();
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(d);
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "numeric", hour12: false }).format(d));
  return { time, awake: hour >= 8 && hour < 23 };
}

/** "14:32 in Lisbon" — a small human detail. Rendered client-side only, so no hydration mismatch. */
export function LocalTime({ city }: { city: string }) {
  const [state, setState] = useState<ReturnType<typeof now> | null>(null);

  useEffect(() => {
    const tick = () => setState(now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  return (
    <span className="inline-flex items-center gap-1.5" title={state?.awake ? "Probably awake" : "Probably asleep"}>
      <span className={`h-1.5 w-1.5 rounded-full ${state?.awake ? "bg-ok pulse-dot" : "bg-faint"}`} aria-hidden />
      <span className="tabular-nums">{state?.time ?? "--:--"}</span> in {city}
    </span>
  );
}
