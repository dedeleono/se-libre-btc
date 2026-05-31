"use client";

import * as React from "react";
import Image from "next/image";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  size?: number;
  className?: string;
};

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createPattern(seed: string) {
  const hash = hashString(seed || "se-libre");
  const hueA = hash % 360;
  const hueB = (hueA + 42 + ((hash >>> 8) % 96)) % 360;
  const bgHue = (hueA + 210) % 360;
  const cells: string[] = [];

  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const bit = (hash >> ((row * 3 + col) % 24)) & 1;
      if (!bit) continue;

      const x = 16 + col * 16;
      const mirrorX = 16 + (4 - col) * 16;
      const y = 16 + row * 16;
      const opacity = 0.72 + (((hash >> (row + col)) & 3) * 0.08);
      const rect = `<rect x="${x}" y="${y}" width="13" height="13" rx="3" fill="url(#paint)" opacity="${opacity.toFixed(2)}"/>`;
      cells.push(rect);

      if (mirrorX !== x) {
        cells.push(
          `<rect x="${mirrorX}" y="${y}" width="13" height="13" rx="3" fill="url(#paint)" opacity="${opacity.toFixed(2)}"/>`
        );
      }
    }
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <defs>
        <linearGradient id="paint" x1="18" y1="14" x2="80" y2="84" gradientUnits="userSpaceOnUse">
          <stop stop-color="hsl(${hueA}, 84%, 52%)"/>
          <stop offset="1" stop-color="hsl(${hueB}, 88%, 62%)"/>
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="48" fill="hsl(${bgHue}, 36%, 94%)"/>
      <circle cx="72" cy="24" r="18" fill="hsl(${hueB}, 90%, 76%)" opacity=".22"/>
      <circle cx="22" cy="76" r="20" fill="hsl(${hueA}, 90%, 70%)" opacity=".20"/>
      ${cells.join("")}
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function UserAvatar({
  userId,
  email,
  name,
  image,
  size = 40,
  className,
}: UserAvatarProps) {
  const seed = userId || email || name || "se-libre";
  const fallbackSrc = React.useMemo(() => createPattern(seed), [seed]);
  const label = name || email || "User avatar";

  return (
    <Avatar
      className={cn("border border-border bg-muted", className)}
      style={{ width: size, height: size }}
    >
      <AvatarImage src={image || undefined} alt={label} className="object-cover" />
      <AvatarFallback className="bg-transparent">
        <Image
          src={fallbackSrc}
          alt=""
          width={size}
          height={size}
          unoptimized
          className="h-full w-full rounded-full object-cover"
          aria-hidden="true"
        />
      </AvatarFallback>
    </Avatar>
  );
}
