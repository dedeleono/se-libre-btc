"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/lib/i18n";

export function CompletionHero({ courseTitle }: { courseTitle: string }) {
  const { t } = useLocale();
  // Render confetti only after mount → no SSR/hydration mismatch from random values.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative flex flex-col items-center gap-2 overflow-hidden py-10 text-center"
    >
      {mounted && <ConfettiBurst />}
      <span className="text-5xl">🎉</span>
      <h1 className="font-[var(--font-display)] text-5xl uppercase leading-none">{t.completion.heroTitle}</h1>
      <p className="text-lg font-semibold text-muted-foreground">{t.completion.heroSubtitle(courseTitle)}</p>
    </motion.div>
  );
}

function ConfettiBurst() {
  const colors = ["#F7931A", "#E2B23A", "#1A8765", "#C0573B"];
  // Stable per-mount randoms; horizontal spread via static `left` (animating x% on an
  // 8px element does nothing useful).
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        left: Math.random() * 100,
        color: colors[i % colors.length],
        duration: 1.4 + Math.random(),
        delay: Math.random() * 0.3,
        rotate: Math.random() * 540,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 1, y: -20, rotate: 0 }}
          animate={{ opacity: 0, y: 240, rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          style={{ position: "absolute", top: 0, left: `${p.left}%`, width: 8, height: 14, background: p.color }}
        />
      ))}
    </div>
  );
}
