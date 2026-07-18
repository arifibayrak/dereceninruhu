/** Turkish-locale formatting helpers. */

const net2 = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const intFmt = new Intl.NumberFormat("tr-TR");
const tryFmt = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 2,
});

/** Net: 48.75 → "48,75". */
export function formatNet(n: number): string {
  return net2.format(n);
}

/** Signed net delta: 8 → "+8", -3.5 → "−3,5". */
export function formatDelta(n: number): string {
  if (n === 0) return "0";
  const sign = n > 0 ? "+" : "−";
  return `${sign}${net2.format(Math.abs(n))}`;
}

export function formatInt(n: number): string {
  return intFmt.format(n);
}

/** Money is stored as integer kuruş; render as ₺. 250000 → "2.500,00 ₺". */
export function formatKurus(kurus: number): string {
  return tryFmt.format(kurus / 100);
}

/**
 * Parse a Turkish-locale ₺ amount into integer kuruş (admin price inputs).
 * Accepts "2.500", "2.500,50", "2500", "2500.5", "₺1.250,00 TL".
 * Returns null when unparseable or negative.
 */
export function parseTryToKurus(input: string): number | null {
  const raw = input.trim().replace(/₺/g, "").replace(/tl/gi, "").replace(/\s/g, "");
  if (!raw) return null;
  let normalized = raw;
  if (raw.includes(",")) {
    // TR format: dots are thousands, comma is decimal.
    normalized = raw.replaceAll(".", "").replace(",", ".");
  } else if (raw.includes(".")) {
    // No comma: "2.500" (TR thousands) vs "2500.5" (EN decimal).
    const parts = raw.split(".");
    const looksLikeThousands =
      parts.length > 1 &&
      parts.every((p, i) => (i === 0 ? p.length >= 1 && p.length <= 3 : p.length === 3));
    if (looksLikeThousands) normalized = parts.join("");
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}
