import { cookies } from "next/headers";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/auth";

export const GUEST_COOKIE = "pricetrail-guest-id";
const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

type Viewer = {
  userId?: string;
  session: Session | null;
  signedIn: boolean;
};

export async function getViewer(): Promise<Viewer> {
  const session = await auth();
  if (session?.user?.id) {
    return { userId: session.user.id, session, signedIn: true };
  }

  const guestId = (await cookies()).get(GUEST_COOKIE)?.value;
  return { userId: guestId, session: null, signedIn: false };
}

export async function getOrCreateViewer(): Promise<Viewer & { createdGuestId?: string }> {
  const viewer = await getViewer();
  if (viewer.userId || viewer.signedIn) return viewer;

  const guestId = randomUUID();
  return { ...viewer, userId: guestId, createdGuestId: guestId };
}

export function setGuestCookie(response: NextResponse, guestId?: string): void {
  if (!guestId) return;

  response.cookies.set(
    GUEST_COOKIE,
    guestId,
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: GUEST_COOKIE_MAX_AGE,
      path: "/"
    }
  );
}
