export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export const withFallbackSlug = (value: string, fallbackPrefix: string) =>
  slugify(value) || `${fallbackPrefix}-${Date.now()}`;
