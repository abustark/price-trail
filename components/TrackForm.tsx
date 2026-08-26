"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Icon } from "@/components/Icons";

export function TrackForm({ signedIn = false }: { signedIn?: boolean }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "navigating" | "error">("idle");
  const [message, setMessage] = useState("");
  const [pasteLoading, setPasteLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url.trim()) return;

    setStatus("loading");
    setMessage("Reading product price...");

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() })
      });
      const payload = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(response.status === 401 ? "Sign in with Google before tracking products." : payload.error || "Could not scan this product.");
        return;
      }

      const productPath = `/products/${payload.product._id}`;
      setStatus("navigating");
      setMessage("Added. Opening price history...");
      setUrl("");
      router.prefetch(productPath);
      router.push(productPath);
    } catch {
      setStatus("error");
      setMessage("Connection failed. Try again.");
    }
  }

  async function pasteFromClipboard() {
    if (!navigator.clipboard) {
      setMessage("Paste the product URL into the field above.");
      setStatus("error");
      return;
    }

    setPasteLoading(true);
    try {
      setUrl(await navigator.clipboard.readText());
      setMessage("");
      setStatus("idle");
    } catch {
      setMessage("Clipboard access was blocked. Paste the link into the field above.");
      setStatus("error");
    } finally {
      setPasteLoading(false);
    }
  }

  const busy = status === "loading" || status === "navigating";

  return (
    <div className="track-panel">
      <form className="search-form" onSubmit={handleSubmit}>
        <div className="input-wrap">
          <Icon name="link" size={18} />
          <label className="sr-only" htmlFor="product-url">Product URL</label>
          <input
            id="product-url"
            className="search-input"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Paste any product URL"
            type="url"
            inputMode="url"
            aria-label="Product URL"
            disabled={busy}
            required
          />
          <button
            className="paste-button"
            type="button"
            onClick={pasteFromClipboard}
            disabled={busy || pasteLoading}
            aria-label="Paste URL from clipboard"
            title="Paste from clipboard"
          >
            {pasteLoading ? "…" : "Paste"}
          </button>
        </div>
        <button className="button search-button" disabled={busy} type="submit">
          {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="arrow" size={17} />}
          <span>{status === "navigating" ? "Opening" : status === "loading" ? "Scanning" : "Track price"}</span>
        </button>
      </form>
      <div className="form-note"><Icon name={signedIn ? "lock" : "globe"} size={14} /> {status === "idle" ? signedIn ? "Private watchlist" : "Guest demo · sign in to sync" : "Scanning..."}</div>
      <div className={`status-slot ${message ? "has-message" : ""}`}>
        {message ? (
          <div className={`status-banner ${status}`} role={status === "error" ? "alert" : "status"}>
            {busy ? <span className="pulse-dot" aria-hidden="true" /> : null}
            <span>{message}</span>
          </div>
        ) : null}
      </div>
      {status === "navigating" ? (
        <div className="page-transition" role="status" aria-live="polite">
          <div className="transition-card">
            <span className="transition-ring" aria-hidden="true" />
            <p className="eyebrow">Price history</p>
            <strong>Loading your timeline</strong>
            <span className="muted">Almost there.</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
