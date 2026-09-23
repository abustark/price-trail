import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DROPS_COOKIE, DROPS_WINDOW_MS, getRecentDrops } from "@/lib/recent-drops";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  const jar = await cookies();
  const now = Date.now();

  let start = Number(jar.get(DROPS_COOKIE)?.value);
  let rotated = false;
  if (!Number.isFinite(start) || start <= 0 || start > now || now - start >= DROPS_WINDOW_MS) {
    start = now;
    rotated = true;
  }

  try {
    const items = await getRecentDrops(start);
    const response = NextResponse.json(
      { windowStart: start, items },
      { headers: { "cache-control": "private, no-store" } }
    );

    if (rotated) {
      response.cookies.set(DROPS_COOKIE, String(start), {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: Math.floor(DROPS_WINDOW_MS / 1000)
      });
    }

    return response;
  } catch {
    return NextResponse.json(
      { windowStart: start, items: [] },
      { status: 200, headers: { "cache-control": "private, no-store" } }
    );
  }
}
