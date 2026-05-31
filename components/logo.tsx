"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";
import Logo from "../public/logo.png";
import LogoDark from "../public/logoDark.png";

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
  alt = "logo",
  priority = true,
}: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const logoSrc = resolvedTheme === "dark" ? LogoDark : Logo;

  return (
    <div
      className={className}
      style={{
        display: "inline-block",
        width: width,
        height: height,
        position: "relative",
      }}
    >
      <Image
        src={logoSrc}
        alt={alt}
        fill
        style={{ objectFit: "contain", objectPosition: "left center" }}
        priority={priority}
      />
    </div>
  );
}
