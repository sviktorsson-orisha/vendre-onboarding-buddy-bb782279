import { useState } from "react";

import { resolveImageUrl } from "@/lib/vendre/api";
import { cn } from "@/lib/utils";
import type { VendreImage } from "@/types/vendre";

/**
 * Width variants requested from the store's image resizer (`?w=`). Verified
 * live: Vendre scales /image/{id}/{file}?w=N; it does not convert to WebP
 * (a .webp name still returns JPEG bytes), so only the size is varied.
 * `full` keeps the original file (product page).
 */
const SIZE_WIDTH = { thumb: 160, card: 480, full: null } as const;
export type StoreImageSize = keyof typeof SIZE_WIDTH;

function sized(src: string, size: StoreImageSize) {
  const width = SIZE_WIDTH[size];
  if (!width || !src.startsWith("/api/vendre/image/")) return src;
  return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
}

/** Renders a store image and falls back to a branded placeholder (demo mode has no images). */
export function StoreImage({
  image,
  alt,
  className,
  label,
  size = "full",
}: {
  image?: VendreImage | null;
  alt: string;
  className?: string;
  label?: string;
  size?: StoreImageSize;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = failed ? null : resolveImageUrl(image?.image ?? image?.path);
  const src = resolved ? sized(resolved, size) : null;

  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-secondary to-muted",
          className,
        )}
        aria-label={alt}
        role="img"
      >
        <span className="brand-wordmark text-2xl text-muted-foreground/70">
          {(label ?? alt).slice(0, 2).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
