import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { randomBytes } from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Strips HTML tags and decodes the common entities so rich-text fields can be
// shown as a plain-text excerpt (e.g. catalog cards). Also rescues legacy rows
// where the editor's ContentEditable wrapper markup was stored by mistake.
export function stripHtmlToText(value: string | null | undefined): string {
  if (!value) return "";

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export const formatPrice = (price: number | string | { toString: () => string } | null | undefined): string => {
  const numericPrice = price == null ? 0 : Number(price.toString());

  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
  }).format(Number.isFinite(numericPrice) ? numericPrice : 0);
};

export const createInvitationToken = () => {
  return randomBytes(32).toString('hex');
};

export const handleTemplateSelect = (
  setSubject: (subject: string) => void,
  setContent: (content: string) => void
) => (subject: string, content: string) => {
  setSubject(subject);
  setContent(content);
};