"use client";

import { useState } from "react";
import { Icon } from "@/components/Icons";

export function ProductImage({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span className="product-image product-image-fallback" aria-label={`${alt} image unavailable`} role="img">
        <Icon name="spark" size={18} />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="product-image"
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
