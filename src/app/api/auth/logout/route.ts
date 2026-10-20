import { NextResponse } from "next/server";
import { isSameOrigin, OWNER_COOKIE, SESSION_COOKIE } from "@/lib/session";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(OWNER_COOKIE);
  return res;
}
