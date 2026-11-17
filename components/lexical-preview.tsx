"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

interface LexicalPreviewProps {
  value: string;
  className?: string;
}

export function LexicalPreview({ value, className }: LexicalPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLocale();
  const tableLabel = t.course.scrollableTable;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!value) {
      container.innerHTML = "";
      return;
    }
    const doc = new DOMParser().parseFromString(value, "text/html");
    doc
      .querySelectorAll('.toolbar, .actions, .floating-text-format-popup, [role="toolbar"], [data-lexical-toolbar="true"]')
      .forEach((el) => el.remove());
    doc.querySelectorAll("[contenteditable]").forEach((el) => el.removeAttribute("contenteditable"));
    doc.querySelectorAll("table").forEach((table) => {
      const parent = table.parentElement;
      const wrapper = parent?.classList.contains("PlaygroundEditorTheme__tableScrollableWrapper")
        ? parent
        : doc.createElement("div");
      if (wrapper !== parent) {
        table.replaceWith(wrapper);
        wrapper.appendChild(table);
      }
      wrapper.classList.add("lesson-table-scroll");
      wrapper.setAttribute("role", "region");
      wrapper.setAttribute("tabindex", "0");
      wrapper.setAttribute("aria-label", tableLabel);
    });
    const content = doc.querySelector(".editor-input, .editor") ?? doc.body;
    container.innerHTML = content.innerHTML;
  }, [value, tableLabel]);

  return <div ref={containerRef} className={cn("lexical-preview", className)} />;
}
