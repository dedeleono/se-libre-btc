"use client";

import { LexicalPreview } from "./lexical-preview";

interface PreviewProps {
  value: string;
}

export const Preview = ({ value }: PreviewProps) => {
  return <LexicalPreview value={value} />;
};
