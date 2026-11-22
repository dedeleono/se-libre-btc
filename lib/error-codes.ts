export const ERROR_CODES = [
  "invitationInvalid",
  "invitationExpired",
  "invitationFailed",
  "accountRoleMissing",
  "accountBlocked",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export function parseErrorCode(value: unknown): ErrorCode | null {
  return typeof value === "string" && (ERROR_CODES as readonly string[]).includes(value)
    ? (value as ErrorCode)
    : null;
}

export function errorPath(code: ErrorCode): string {
  return `/error?code=${code}`;
}
