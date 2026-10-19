import { NextResponse } from "next/server";
import { authConfigured, getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  return NextResponse.json(
    {
      configured: authConfigured(),
      viewer: session ? { login: session.login, avatarUrl: session.avatarUrl, name: session.name } : null,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
