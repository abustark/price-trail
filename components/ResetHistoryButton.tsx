"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResetHistoryButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function resetHistory() {
    if (!window.confirm("Clear this product's saved price history?")) return;

    setLoading(true);
    setError("");

    const deleteResponse = await fetch(`/api/products/${productId}/samples`, { method: "DELETE" });
    if (!deleteResponse.ok) {
      const payload = await deleteResponse.json();
      setError(payload.error || "Could not reset history.");
      setLoading(false);
      return;
    }

    const scanResponse = await fetch(`/api/products/${productId}/scan`, { method: "POST" });
    if (!scanResponse.ok) {
      const payload = await scanResponse.json();
      setError(payload.error || "History was cleared, but the rescan failed.");
      setLoading(false);
      router.refresh();
      return;
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <div>
      <button className="button danger" disabled={loading} onClick={resetHistory} type="button">
        {loading ? <span className="spinner" aria-hidden="true" /> : null}
        <span>{loading ? "Resetting" : "Reset history"}</span>
      </button>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
