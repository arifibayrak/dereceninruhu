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
