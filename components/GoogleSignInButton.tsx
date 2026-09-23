"use client";

import { useEffect, useRef } from "react";

/**
 * Google Identity Services sign-in — the Linkly approach.
 *
 * Google renders its own button (and One Tap for returning users); the
 * callback hands us an ID token which /api/auth/google verifies once and
 * turns into a session cookie. No OAuth redirect chain, no page navigation.
 *
 * Hard rules encoded here:
 * - initialize() exactly once per page (inited ref)
 * - gsi/client loads async; init via retry-poll (100ms, capped at 8s)
 * - prompt() at most once per page (prompted ref) — no hammering
 * - silent failure: if GIS never loads, nothing renders; guest tracking
 *   still works without an account
 */

type CredentialResponse = { credential?: string };

type GisIdApi = {
  initialize: (options: { client_id: string; callback: (response: CredentialResponse) => void }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      theme?: "outline" | "filled";
      size?: "large" | "small";
      text?: "signin_with" | "signup_with" | "continue_with";
      shape?: "rectangular" | "pill";
      width?: number;
    }
  ) => void;
  prompt: (notificationCallback?: (notification: unknown) => void) => void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GisIdApi;
      };
    };
  }
}

export function GoogleSignInButton({ clientId }: { clientId: string }) {
  const btnRef = useRef<HTMLDivElement | null>(null);
  const inited = useRef(false);
  const prompted = useRef(false);

  useEffect(() => {
    if (!clientId) return;
    let poll: ReturnType<typeof setInterval> | undefined;
    let cap: ReturnType<typeof setTimeout> | undefined;

    const promptOnce = () => {
      if (prompted.current) return;
      prompted.current = true;
      try {
        window.google?.accounts?.id?.prompt();
      } catch {
        // One Tap blocked/unavailable — the visible button remains.
      }
    };

    const tryInit = (): boolean => {
      const gis = window.google?.accounts?.id;
      if (!gis) return false;
      if (inited.current) return true;

      inited.current = true;
      gis.initialize({
        client_id: clientId,
        callback: (response) => {
          if (!response.credential) return;
          fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: response.credential }),
            credentials: "include"
          })
            .then((res) => {
              if (res.ok) window.location.reload();
            })
            .catch(() => {
              // Network hiccup — user can tap the button again.
            });
        }
      });

      if (btnRef.current) {
        gis.renderButton(btnRef.current, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "pill",
          width: 160
        });
      }

      promptOnce();
      return true;
    };

    if (!tryInit()) {
      poll = setInterval(() => {
        if (tryInit() && poll) clearInterval(poll);
      }, 100);
      cap = setTimeout(() => {
        if (poll) clearInterval(poll);
      }, 8000);
    }

    window.addEventListener("load", promptOnce);

    return () => {
      if (poll) clearInterval(poll);
      if (cap) clearTimeout(cap);
      window.removeEventListener("load", promptOnce);
    };
  }, [clientId]);

  return <div className="gis-signin" ref={btnRef} aria-label="Sign in with Google" />;
}
