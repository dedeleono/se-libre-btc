"use client";

import * as React from "react";

import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function TableScrollRegion({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { t } = useLocale();
  const ref = React.useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = React.useState(false);
  const [atEnd, setAtEnd] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => {
      setOverflowing(element.scrollWidth > element.clientWidth + 1);
      setAtEnd(Math.abs(element.scrollLeft) + element.clientWidth >= element.scrollWidth - 1);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <div
          ref={ref}
          role={overflowing ? "region" : undefined}
          aria-label={overflowing ? label : undefined}
          tabIndex={overflowing ? 0 : undefined}
          className="overflow-x-auto overscroll-x-contain rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <table className="w-full caption-bottom text-sm">{children}</table>
        </div>
        {overflowing && !atEnd && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 end-0 w-10 bg-gradient-to-l from-card to-transparent rtl:bg-gradient-to-r"
          />
        )}
      </div>
      {overflowing && <p className="text-xs text-muted-foreground">{t.common.scrollTableHint}</p>}
    </div>
  );
}
