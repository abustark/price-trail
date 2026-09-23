"use client";

import { useRouter } from "next/navigation";

/**
 * iPhone-style back control for sub-pages (how-it-works, privacy, terms).
 * Goes to the previous page when there is one, otherwise falls back home.
 */
export function BackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter();

  return (
    <button
      className="back-button"
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m15 6-6 6 6 6" />
      </svg>
      <span>Back</span>
    </button>
  );
}
