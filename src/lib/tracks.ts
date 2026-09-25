/**
 * Sınav bölümleri (alan / düzey) — TEK doğruluk kaynağı.
 *
 * YKS'de bölüm "alan"dır (Sayısal / Eşit Ağırlık / Sözel), KPSS'de "düzey"dir
 * (Lisans / Ön Lisans / Ortaöğretim). İkisi de veritabanında aynı tabloda
 * (`tracks`) durur; buradaki liste seed ve migration ile birebir aynı olmalı
 * (bkz. `src/db/seed/exam-templates.ts`, `drizzle/migrations/0030_*.sql`).
 *
 * Bu modül `@/db`'ye DOKUNMAZ: form ve tablo gibi istemci bileşenleri de
 * buradan okur (sunucu şeması tarayıcı paketine sızmasın).
 */

export type TrackOption = { value: string; label: string };

export const EXAM_CODES = ["KPSS", "YKS", "LGS", "DGS"] as const;
export type ExamCode = (typeof EXAM_CODES)[number];

export const KPSS_TRACKS: readonly TrackOption[] = [
  { value: "LISANS", label: "Lisans" },
  { value: "ONLISANS", label: "Ön Lisans" },
  { value: "ORTAOGRETIM", label: "Ortaöğretim" },
];

export const YKS_TRACKS: readonly TrackOption[] = [
  { value: "SAY", label: "Sayısal" },
  { value: "EA", label: "Eşit Ağırlık" },
  { value: "SOZ", label: "Sözel" },
];

const BY_EXAM: Record<string, readonly TrackOption[]> = {
  KPSS: KPSS_TRACKS,
  YKS: YKS_TRACKS,
  LGS: [],
  DGS: [],
};

/** Sınavın bölümleri — LGS ve DGS'de boş dizi (bölümsüz sınav). */
export function tracksFor(examCode: string | null | undefined): TrackOption[] {
  return [...(BY_EXAM[examCode ?? ""] ?? [])];
}

/** Bölüm seçimi zorunlu mu? Bölümsüz sınavlar (LGS, DGS) hariç evet. */
export function trackRequired(examCode: string | null | undefined): boolean {
  return tracksFor(examCode).length > 0;
}

/** Kod bu sınava ait mi (KPSS'ye "SAY" yazılmasın). */
export function isTrackOfExam(
  examCode: string | null | undefined,
  trackCode: string | null | undefined,
): boolean {
  if (!trackCode) return false;
  return tracksFor(examCode).some((t) => t.value === trackCode);
}

/** Alan adı; bilinmeyen kod kendi kodunu döner. */
export function trackLabel(
  examCode: string | null | undefined,
  trackCode: string | null | undefined,
): string | null {
  if (!trackCode) return null;
  return (
    tracksFor(examCode).find((t) => t.value === trackCode)?.label ?? trackCode
  );
}

/** Alan mı düzey mi — form etiketleri sınava göre değişir. */
export function trackFieldLabel(examCode: string | null | undefined): string {
  return examCode === "KPSS" ? "Düzey" : "Alan";
}

/** İyelik ekli hali: "İkinci sınavın alanı / düzeyi" (ek Türkçe'de değişir). */
export function trackFieldPossessive(examCode: string | null | undefined): string {
  return examCode === "KPSS" ? "düzeyi" : "alanı";
}

/** "KPSS · Lisans" — rozet ve grup başlıkları için. */
export function examTrackLabel(
  examCode: string,
  trackCode: string | null | undefined,
): string {
  const label = trackLabel(examCode, trackCode);
  return label ? `${examCode} · ${label}` : examCode;
}

/** Sıralama anahtarı: sınav sırası, sonra bölüm sırası (bölümsüz en sonda). */
export function trackSortIndex(
  examCode: string,
  trackCode: string | null | undefined,
): number {
  const list = tracksFor(examCode);
  const i = list.findIndex((t) => t.value === trackCode);
  return i === -1 ? list.length : i;
}

export function examSortIndex(examCode: string): number {
  const i = (EXAM_CODES as readonly string[]).indexOf(examCode);
  return i === -1 ? EXAM_CODES.length : i;
}
