import { randomInt } from "node:crypto";

// Crockford base32 (no I, L, O, U) — unambiguous, human-readable.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function generateSerial(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  let code = "";
  for (let i = 0; i < 6; i++) code += ALPHABET[randomInt(0, ALPHABET.length)];
  return `DL-${year}-${code}`;
}

export type CertificateRecipient = {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email: string;
};

export function prefillRecipientName(user: CertificateRecipient): string {
  const clean = (v?: string | null) => (v ?? "").replace(/\s+/g, " ").trim();
  const full = clean(`${clean(user.firstName)} ${clean(user.lastName)}`);
  if (full) return full;
  const name = clean(user.name);
  if (name) return name;
  const local = clean(user.email.split("@")[0]);
  return local || "Estudiante";
}
