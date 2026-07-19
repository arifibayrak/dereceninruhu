/**
 * Muhasebe pure helpers — money is ALWAYS integer kuruş (see AGENTS.md).
 * UI collects ₺ as text ("2.500,50" / "2500.50" / "2500"); we convert once at
 * the boundary and never store floats. No DB access here.
 */

import { startOfTrtDay } from "@/lib/dates";

const TRT_OFFSET_MS = 3 * 60 * 60 * 1000;

/**
 * Parse a Turkish-entered ₺ amount into integer kuruş.
 * Accepts "2500", "2.500", "2500,50", "2.500,50" and "2500.50".
 * Returns null when unparseable or negative.
 */
export function parseTryToKurus(raw: string): number | null {
  const t = raw.trim().replace(/[₺\s]/g, "");
  if (!t) return null;
  let normalized: string;
  if (t.includes(",")) {
    // Turkish style: dots are thousands separators, comma is decimal.
    normalized = t.replace(/\./g, "").replace(",", ".");
  } else {
    const dots = t.match(/\./g)?.length ?? 0;
    if (dots > 1) {
      // "1.250.000" — all dots are thousands separators.
      normalized = t.replace(/\./g, "");
    } else if (dots === 1 && /\.\d{3}$/.test(t)) {
      // "2.500" — single dot followed by exactly 3 digits reads as thousands.
      normalized = t.replace(/\./g, "");
    } else {
      normalized = t; // "2500.5" — decimal dot.
    }
  }
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

/** Kuruş → editable ₺ text for form defaults ("250000" → "2500" / "2500,50"). */
export function kurusToTryInput(kurus: number): string {
  const lira = Math.trunc(kurus / 100);
  const rem = Math.abs(kurus % 100);
  return rem === 0 ? String(lira) : `${lira},${String(rem).padStart(2, "0")}`;
}

const monthLabelFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  month: "long",
  year: "numeric",
});

/** "Temmuz 2026" — default fatura dönem etiketi. */
export function trMonthLabel(d: Date = new Date()): string {
  return monthLabelFmt.format(d);
}

/** TRT ayının [başlangıç, sonraki ay başlangıcı) aralığı. */
export function trtMonthRange(d: Date = new Date()): { start: Date; end: Date } {
  const shifted = new Date(startOfTrtDay(d).getTime() + TRT_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1) - TRT_OFFSET_MS);
  const end = new Date(Date.UTC(y, m + 1, 1) - TRT_OFFSET_MS);
  return { start, end };
}

export type InvoiceStatus =
  | "taslak"
  | "gönderildi"
  | "ödendi"
  | "gecikmiş"
  | "iptal";

/**
 * Bakiye + vade üzerinden fatura durumunu türetir (ödeme kaydından sonra).
 * İptal edilen faturaya dokunmayız; tam ödenen "ödendi", vadesi geçen açık
 * fatura "gecikmiş", kalanı mevcut akışında ("taslak" ödeme alınca gönderilir).
 */
export function resolveInvoiceStatus(opts: {
  current: InvoiceStatus;
  amountKurus: number;
  paidKurus: number;
  dueOn: Date | null;
  now?: Date;
}): InvoiceStatus {
  const { current, amountKurus, paidKurus, dueOn } = opts;
  const now = opts.now ?? new Date();
  if (current === "iptal") return "iptal";
  if (paidKurus >= amountKurus) return "ödendi";
  if (dueOn && startOfTrtDay(dueOn).getTime() < startOfTrtDay(now).getTime()) {
    return "gecikmiş";
  }
  return current === "taslak" ? "gönderildi" : current;
}

/** Fatura durum rozetleri için Türkçe etiketler. */
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  taslak: "Taslak",
  gönderildi: "Gönderildi",
  ödendi: "Ödendi",
  gecikmiş: "Gecikmiş",
  iptal: "İptal",
};

export type PaymentMethod = "havale" | "nakit" | "kart" | "diğer";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  havale: "Havale / EFT",
  nakit: "Nakit",
  kart: "Kart",
  diğer: "Diğer",
};

export type PaymentNoticeStatus = "bekliyor" | "onaylandı" | "reddedildi";

export const PAYMENT_NOTICE_STATUS_LABELS: Record<PaymentNoticeStatus, string> = {
  bekliyor: "Onay bekliyor",
  onaylandı: "Onaylandı",
  reddedildi: "Reddedildi",
};

export type BillingType = "haftalık" | "aylık" | "paket" | "tek_seferlik";

export const BILLING_TYPE_LABELS: Record<BillingType, string> = {
  haftalık: "Haftalık",
  aylık: "Aylık",
  paket: "Paket",
  tek_seferlik: "Tek seferlik",
};

/** Otomatik yinelenen (abonelik) plan tipleri — fatura kendiliğinden kesilir. */
export type RecurringBillingType = "haftalık" | "aylık";
export const RECURRING_BILLING_TYPES: RecurringBillingType[] = [
  "haftalık",
  "aylık",
];

export function isRecurringBilling(t: BillingType): t is RecurringBillingType {
  return t === "haftalık" || t === "aylık";
}

const dayMonthFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
});

/**
 * Bir sonraki fatura tarihini döndürür (TRT gün başı hizalı):
 * haftalık → +7 gün; aylık → +1 ay (aynı gün, ay kısaysa kırpılır).
 */
export function advanceBillingDate(
  from: Date,
  type: RecurringBillingType,
): Date {
  const base = startOfTrtDay(from);
  if (type === "haftalık") {
    return new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  // aylık — TRT'ye kaydırıp ay ekle, gün taşarsa ay sonuna kırp.
  const shifted = new Date(base.getTime() + TRT_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth();
  const d = shifted.getUTCDate();
  const daysInNext = new Date(Date.UTC(y, m + 2, 0)).getUTCDate();
  const day = Math.min(d, daysInNext);
  return new Date(Date.UTC(y, m + 1, day) - TRT_OFFSET_MS);
}

/**
 * Faturanın dönem etiketi — aynı zamanda idempotency anahtarı:
 * aylık → "Temmuz 2026"; haftalık → "20 Tem haftası".
 */
export function billingPeriodLabel(
  date: Date,
  type: RecurringBillingType,
): string {
  if (type === "aylık") return trMonthLabel(date);
  return `${dayMonthFmt.format(date)} haftası`;
}
