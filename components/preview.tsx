"use client";

import { LexicalPreview } from "./lexical-preview";

interface PreviewProps {
  value: string;
  className?: string;
}

export const Preview = ({ value, className }: PreviewProps) => {
  return <LexicalPreview value={value} className={className} />;
};
