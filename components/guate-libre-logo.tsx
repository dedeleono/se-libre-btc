"use client";

import Image from "next/image";

// Trimmed "GUATE LIBRE" wordmark assets (1329x552). Height derives from this.
const ASPECT = 1329 / 552;

interface GuateLibreLogoProps {
  /** Rendered width in px; height is derived from the logo aspect ratio. */
  width?: number;
  className?: string;
  priority?: boolean;
}

/**
 * Theme-aware Guate Libre wordmark: black on light, white on dark.
 * Mirrors the conventions of <Logo /> (components/logo.tsx).
 */
export default function GuateLibreLogo({
  width = 140,
  className,
  priority = false,
}: GuateLibreLogoProps) {
  const height = Math.round(width / ASPECT);
  return (
    <span
      className={className}
      role="img"
      aria-label="Guate Libre"
      style={{ display: "inline-block", position: "relative", width, height }}
    >
      {/* Light theme: black wordmark */}
      <Image
        src="/images/se_libre/guate-libre-black.png"
        alt=""
        fill
        sizes={`${width}px`}
        priority={priority}
        className="object-contain object-left dark:hidden"
      />
      {/* Dark theme: white wordmark */}
      <Image
        src="/images/se_libre/guate-libre-white.png"
        alt=""
        fill
        sizes={`${width}px`}
        priority={priority}
        className="hidden object-contain object-left dark:block"
      />
    </span>
  );
}
