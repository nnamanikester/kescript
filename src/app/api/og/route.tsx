import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

/**
 * Social card: /api/og?title=…&kicker=…&meta=…
 * A frontmatter `image:` on a post overrides this.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") ?? SITE.tagline).slice(0, 140);
  const kicker = (searchParams.get("kicker") ?? "~/kescript").slice(0, 60);
  const meta = (searchParams.get("meta") ?? "").slice(0, 80);
  const size = title.length > 90 ? 52 : title.length > 55 ? 62 : 74;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#0c0c0d",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          color: "#f4f4f5",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, color: "#a1a1aa" }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: "#f59e0b" }} />
          <span>{kicker}</span>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: size,
            lineHeight: 1.08,
            letterSpacing: "-0.035em",
            fontWeight: 700,
            fontFamily: "sans-serif",
            maxWidth: 1000,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #27272a",
            paddingTop: 28,
            fontSize: 24,
            color: "#a1a1aa",
          }}
        >
          <span style={{ color: "#f4f4f5" }}>{SITE.author}</span>
          <span>{meta || SITE.url.replace(/^https?:\/\//, "")}</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
