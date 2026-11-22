const INLINE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
  "application/pdf",
]);

export function isServableKey(key: string): boolean {
  return key.startsWith("assets/") && !key.split("/").includes("..");
}

export function fileResponseHeaders(input: { contentType?: string; contentLength?: number }): Headers {
  const headers = new Headers();
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  if (input.contentLength !== undefined) {
    headers.set("Content-Length", String(input.contentLength));
  }

  const mediaType = input.contentType?.split(";")[0].trim().toLowerCase();
  if (input.contentType && mediaType && INLINE_TYPES.has(mediaType)) {
    headers.set("Content-Type", input.contentType);
    headers.set("Content-Disposition", "inline");
  } else {
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Disposition", "attachment");
  }

  return headers;
}
