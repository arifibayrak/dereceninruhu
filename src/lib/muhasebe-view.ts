/**
 * Muhasebe görünüm yardımcıları — sorgu satırlarını ödeme diyaloğunun
 * beklediği seçeneklere çevirir. Saf; server component'lerden çağrılır.
 */
import type { EnrollmentOption, InvoiceRow } from "@/db/queries/muhasebe";
import { formatKurus } from "@/lib/format";
import { kurusToTryInput } from "@/lib/muhasebe";
import type {
  OpenInvoiceOption,
  PaymentStudentOption,
} from "@/components/app/payment-record-dialog";

const dayMonthFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
});

/** Açık fatura → seçenek etiketi ("Temmuz 2026 · kalan 2.500,00 ₺"). */
export function toOpenInvoiceOption(inv: InvoiceRow): OpenInvoiceOption {
  const label = inv.periodLabel?.trim() || dayMonthFmt.format(inv.issuedOn);
  return {
    id: inv.id,
    label: `${label} · kalan ${formatKurus(inv.balanceKurus)}`,
    balanceTl: kurusToTryInput(inv.balanceKurus),
  };
}

/** Kadro + açık faturalar → ödeme diyaloğu seçenekleri. */
export function buildPaymentStudentOptions(
  options: EnrollmentOption[],
  openInvoices: InvoiceRow[],
): PaymentStudentOption[] {
  const byEnrollment = new Map<number, OpenInvoiceOption[]>();
  for (const inv of openInvoices) {
    if (inv.balanceKurus <= 0) continue;
    const list = byEnrollment.get(inv.enrollmentId) ?? [];
    list.push(toOpenInvoiceOption(inv));
    byEnrollment.set(inv.enrollmentId, list);
  }
  return options.map((o) => ({
    enrollmentId: o.enrollmentId,
    label: o.label,
    openInvoices: byEnrollment.get(o.enrollmentId) ?? [],
  }));
}
