/**
 * Sınav geri sayımı ("Sayaç") için hedef tarihler.
 *
 * Tek doğ­ruluk kaynağı: bu dosya. Yeni sınav takvimi açıklandığında tarihleri
 * burada güncelle (ÖSYM/MEB kaynağına göre). Tarih "yyyy-mm-dd" biçiminde ve
 * TRT (Europe/Istanbul, sabit +03:00) gece yarısı anı olarak yorumlanır —
 * `src/lib/dates.ts` ile aynı kural.
 *
 * KPSS 2026 tarihleri ÖSYM takviminden kesindir. LGS ve YKS 2026 oturumları
 * geçtiği için sıradaki (2027) tarihler henüz resmi değil; `estimated: true`
 * ile "tahmini" olarak işaretlenir.
 *
 * NOT: renk sınıfları (dotClass/numberClass) Tailwind'in JIT taraması için
 * TAM LİTERAL yazılmalı — `bg-${x}` gibi birleştirme çalışmaz.
 */
export type ExamCountdown = {
  key: string;
  exam: "LGS" | "YKS" | "KPSS";
  title: string;
  /** Kısa alt not, örn. oturum bilgisi. */
  note?: string;
  /** "yyyy-mm-dd" — TRT gece yarısı anı. */
  date: string;
  /** Resmi olmayan (tahmini) tarih. */
  estimated?: boolean;
  /** Renk noktası — site chart paleti (bkz. EXAM_DOT). */
  dotClass: string;
  /** Büyük "gün" sayısının rengi. */
  numberClass: string;
};

export const EXAM_COUNTDOWNS: ExamCountdown[] = [
  {
    key: "kpss-lisans",
    exam: "KPSS",
    title: "KPSS Lisans",
    note: "GY-GK oturumu",
    date: "2026-09-06",
    dotClass: "bg-chart-3",
    numberClass: "text-chart-3",
  },
  {
    key: "kpss-onlisans",
    exam: "KPSS",
    title: "KPSS Ön Lisans",
    date: "2026-10-04",
    dotClass: "bg-chart-4",
    numberClass: "text-chart-4",
  },
  {
    key: "kpss-ortaogretim",
    exam: "KPSS",
    title: "KPSS Ortaöğretim (Lise)",
    date: "2026-10-25",
    dotClass: "bg-chart-5",
    numberClass: "text-chart-5",
  },
  {
    key: "lgs",
    exam: "LGS",
    title: "LGS",
    note: "8. sınıf",
    date: "2027-06-06",
    estimated: true,
    dotClass: "bg-chart-2",
    numberClass: "text-chart-2",
  },
  {
    key: "yks",
    exam: "YKS",
    title: "YKS (TYT-AYT)",
    date: "2027-06-19",
    estimated: true,
    dotClass: "bg-chart-1",
    numberClass: "text-chart-1",
  },
];

/** ISO tarihini TRT (+03:00) gece yarısı anına çevirir. */
export function examTargetDate(date: string): Date {
  return new Date(`${date}T00:00:00+03:00`);
}
