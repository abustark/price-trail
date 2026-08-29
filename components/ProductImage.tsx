"use client";

import { useState } from "react";
import { Icon } from "@/components/Icons";

export function ProductImage({ src, alt, priority = false }: { src?: string; alt: string; priority?: boolean }) {
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
      width={92}
      height={92}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
