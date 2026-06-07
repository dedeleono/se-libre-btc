"use client";

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
}: LogoProps) {
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
        className="grid shrink-0 place-items-center rounded-full border-2 border-current bg-primary text-primary-foreground"
        style={{
          width: Math.min(height, 42),
          height: Math.min(height, 42),
          fontFamily: "var(--font-display)",
          fontSize: Math.min(height, 42) * 0.62,
          lineHeight: 1,
        }}
      >
        ₿
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
