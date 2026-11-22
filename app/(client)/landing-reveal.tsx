"use client";

import { useEffect } from "react";

const MAX_STEP = 6;

export default function LandingReveal() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;

    const play = (group: Element, onScreenOnly: boolean) => {
      let step = 0;
      group.querySelectorAll<HTMLElement>('[data-reveal-state="hidden"]').forEach((el) => {
        if (onScreenOnly && el.getBoundingClientRect().top >= window.innerHeight) return;
        el.style.setProperty("--dl-step", String(Math.min(step++, MAX_STEP)));
        el.dataset.revealState = "shown";
        observer.unobserve(el);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const group = entry.isIntersecting && entry.target.closest("[data-reveal-group]");
          if (group) play(group, true);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );

    // Only content still below the fold is hidden, so nothing the visitor already sees can flash.
    document.querySelectorAll<HTMLElement>(".dl-landing [data-reveal-group] [data-reveal]").forEach((el) => {
      if (!el.getClientRects().length || el.getBoundingClientRect().top < window.innerHeight) return;
      el.dataset.revealState = "hidden";
      observer.observe(el);
    });

    const onFocusIn = (event: FocusEvent) => {
      const group = (event.target as Element).closest?.("[data-reveal-group]");
      if (group) play(group, false);
    };
    document.addEventListener("focusin", onFocusIn);

    return () => {
      observer.disconnect();
      document.removeEventListener("focusin", onFocusIn);
    };
  }, []);

  return null;
}
