"use client";

import { useState } from "react";
import { Play } from "lucide-react";

/** A facade: a thumbnail until clicked, so embeds cost nothing until they're wanted. */
export function YouTube({ "data-id": id = "" }: { "data-id"?: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="embed not-prose relative aspect-video overflow-hidden rounded-xl border border-line bg-subtle">
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 h-full w-full"
          aria-label="Play video"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
          />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-black/70 text-white backdrop-blur transition-transform group-hover:scale-105">
              <Play className="ml-0.5 h-6 w-6 fill-current" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
