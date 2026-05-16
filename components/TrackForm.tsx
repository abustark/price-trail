"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function TrackForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "navigating" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url.trim()) return;

    setStatus("loading");
    setMessage("Fetching page data and checking product price...");

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url })
      });
      const payload = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(payload.error || "Could not scan this product.");
        return;
      }

      const productPath = `/products/${payload.product._id}`;
      setStatus("navigating");
      setMessage("Product tracked. Preparing price history...");
      setUrl("");
      router.prefetch(productPath);
      router.push(productPath);
    } catch {
      setStatus("error");
      setMessage("Network error while scanning. Check the dev server and try again.");
    }
  }

  return (
    <div className="track-panel">
      <form className="search-form" onSubmit={handleSubmit}>
        <input
          className="search-input"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Paste Amazon, Flipkart, Myntra or Ajio link"
          type="url"
          aria-label="Product URL"
          disabled={status === "loading" || status === "navigating"}
          required
        />
        <button className="button search-button" disabled={status === "loading" || status === "navigating"} type="submit">
          {status === "loading" || status === "navigating" ? <span className="spinner" aria-hidden="true" /> : null}
          <span>{status === "navigating" ? "Opening" : status === "loading" ? "Scanning" : "Track"}</span>
        </button>
      </form>
      {message ? (
        <div className={`status-banner ${status}`} role={status === "error" ? "alert" : "status"}>
          {status === "loading" || status === "navigating" ? <span className="pulse-dot" aria-hidden="true" /> : null}
          <span>{message}</span>
        </div>
      ) : null}
      {status === "navigating" ? (
        <div className="page-transition" role="status" aria-live="polite">
          <div className="transition-card">
            <span className="transition-ring" aria-hidden="true" />
            <p className="eyebrow">Opening history</p>
            <strong>Building the price timeline</strong>
            <span className="muted">Loading product stats, chart and recent scans...</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
