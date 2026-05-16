"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RescanButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function rescan() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/products/${productId}/scan`, { method: "POST" });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error || "Scan failed.");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button className="button secondary" disabled={loading} onClick={rescan} type="button">
        {loading ? <span className="spinner" aria-hidden="true" /> : null}
        <span>{loading ? "Scanning" : "Scan now"}</span>
      </button>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
