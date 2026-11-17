"use client";

import { useEffect } from "react";

export default function LandingReveal() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let step = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.style.setProperty("--dl-step", String(step++));
          el.dataset.revealState = "shown";
          observer.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );

    // Only content still below the fold is hidden, so nothing the visitor already sees can flash.
    document.querySelectorAll<HTMLElement>(".dl-landing [data-reveal]").forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      el.dataset.revealState = "hidden";
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
