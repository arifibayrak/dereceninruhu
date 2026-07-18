/**
 * Pure phone helpers — safe to import from client OR server (no Cloudflare/
 * server-only deps). Auth uses a phone-derived internal email as the identifier.
 */

const PHONE_EMAIL_DOMAIN = "ogrenci.dereceninruhu.local";

/** Normalize a TR phone to 10 digits (strip +90 / 0 / spaces / punctuation). */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("90")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

/** Deterministic internal email used as Better Auth's identifier for a phone. */
export function phoneToEmail(phone: string): string {
  return `${normalizePhone(phone)}@${PHONE_EMAIL_DOMAIN}`;
}
