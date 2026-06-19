"use client";

import Image from "next/image";

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  alt?: string;
  priority?: boolean;
}

export default function ThemeAwareLogo({
  width = 150,
  height = 150,
  className,
  alt = "Dinero Libre",
  priority = false,
}: LogoProps) {
  const badge = Math.min(height, 42);
  return (
    <div
      className={className}
      aria-label={alt}
      role="img"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        width: width,
        minHeight: Math.min(height, 56),
      }}
    >
      <span
        aria-hidden="true"
        className="relative block shrink-0"
        style={{ width: badge, height: badge }}
      >
        {/* Light theme: dark stamp */}
        <Image
          src="/images/se_libre/25.png"
          alt=""
          fill
          sizes="42px"
          priority={priority}
          className="block object-contain dark:hidden"
        />
        {/* Dark theme: light stamp */}
        <Image
          src="/images/se_libre/24.png"
          alt=""
          fill
          sizes="42px"
          priority={priority}
          className="hidden object-contain dark:block"
        />
      </span>
      <span className="flex flex-col leading-[0.9] text-current">
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: Math.min(width / 5.3, 30),
            letterSpacing: 0,
          }}
        >
          DINERO
        </span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: Math.min(width / 5.3, 30),
            letterSpacing: 0,
          }}
        >
          LIBRE
        </span>
      </span>
    </div>
  );
}
