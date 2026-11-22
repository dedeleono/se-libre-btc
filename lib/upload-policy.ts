export type UploadKind = "image" | "video" | "document";
export type UploadRole = "ADMIN" | "STUDENT";
export type UploadChannel = "presigned" | "server";

type UploadRule = {
  contentTypes: readonly string[];
  maxBytes: Readonly<Partial<Record<UploadRole, number>>>;
};

const MB = 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export const UPLOAD_RULES: Record<UploadKind, UploadRule> = {
  image: { contentTypes: IMAGE_TYPES, maxBytes: { ADMIN: 10 * MB, STUDENT: 4 * MB } },
  video: { contentTypes: ["video/mp4", "video/webm", "video/quicktime"], maxBytes: { ADMIN: 100 * MB } },
  document: {
    contentTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ...IMAGE_TYPES,
    ],
    maxBytes: { ADMIN: 100 * MB },
  },
};

export const MAX_UPLOAD_BYTES = 100 * MB;

export type UploadDecision =
  | { ok: true; kind: UploadKind; contentType: string }
  | { ok: false; status: 400 | 403 | 413 | 415; reason: string };

function isUploadKind(kind: unknown): kind is UploadKind {
  return typeof kind === "string" && Object.prototype.hasOwnProperty.call(UPLOAD_RULES, kind);
}

export function normaliseMediaType(contentType: string): string {
  return contentType.split(";")[0].trim().toLowerCase();
}

export function decideUpload(input: {
  role: UploadRole;
  channel: UploadChannel;
  kind: unknown;
  contentType: unknown;
  size: unknown;
}): UploadDecision {
  const { role, channel, kind, contentType, size } = input;

  if (!isUploadKind(kind)) return { ok: false, status: 400, reason: "Invalid file type" };

  const rule = UPLOAD_RULES[kind];
  const maxBytes = rule.maxBytes[role];
  if (maxBytes === undefined) return { ok: false, status: 403, reason: "Upload not allowed" };
  if (channel === "presigned" && role !== "ADMIN") return { ok: false, status: 403, reason: "Upload not allowed" };

  if (typeof contentType !== "string") return { ok: false, status: 415, reason: "Unsupported file format" };
  const mediaType = normaliseMediaType(contentType);
  if (!rule.contentTypes.includes(mediaType)) return { ok: false, status: 415, reason: "Unsupported file format" };

  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    return { ok: false, status: 400, reason: "Invalid file size" };
  }
  if (size > maxBytes) return { ok: false, status: 413, reason: "File too large" };

  return { ok: true, kind, contentType: mediaType };
}
