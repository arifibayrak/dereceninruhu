/**
 * Soru takibi (question_logs) saf yardımcıları — framework yok, Server Action,
 * client ızgara ve testler aynı mantığı paylaşır.
 *
 * Model kuralı: `questionCount` TEK doğruluk kaynağıdır; tüm hacim/toplam
 * sorguları yalnız onu okur. D/Y/B (doğru/yanlış/boş) OPSİYONEL kırılımdır ve
 * **ya üçü birden doludur ya da üçü birden boştur** — kısmi giriş kabul
 * edilmez, yoksa "toplam ≠ D+Y+B" olan kirli satırlar oluşur.
 */

import { computeNet } from "@/lib/net";

/** Bir hücrenin ham (kullanıcıdan gelen) değerleri. */
export type QuestionBreakdownInput = {
  correctCount?: number | null;
  wrongCount?: number | null;
  blankCount?: number | null;
};

/** Tek bir ders-gün kaydının normalize edilmiş hâli. */
export type NormalizedQuestionEntry = {
  questionCount: number;
  correctCount: number | null;
  wrongCount: number | null;
  blankCount: number | null;
};

/** Girilen soru sayısı üst sınırı (Zod ile aynı; tek yerde tanımlı). */
export const MAX_QUESTIONS_PER_CELL = 2000;

const isNum = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v);

/**
 * D/Y/B üçlüsünün durumu: tamamen dolu, tamamen boş ya da geçersiz (kısmi).
 */
export function breakdownState(
  b: QuestionBreakdownInput,
): "full" | "empty" | "partial" {
  const filled = [b.correctCount, b.wrongCount, b.blankCount].filter(isNum)
    .length;
  if (filled === 3) return "full";
  if (filled === 0) return "empty";
  return "partial";
}

/**
 * Bir hücreyi saklanabilir hâle getirir.
 *
 * - D/Y/B üçü de doluysa toplam **onlardan türetilir** (elle yazılan toplam
 *   yok sayılır — kırılım daha spesifik bilgidir).
 * - Üçü de boşsa yalnız toplam saklanır, kırılım NULL kalır.
 * - Kısmi girişte `null` döner → çağıran hata verir (asla yarım satır yazma).
 */
export function normalizeQuestionEntry(
  input: QuestionBreakdownInput & { questionCount?: number | null },
): NormalizedQuestionEntry | null {
  const state = breakdownState(input);
  if (state === "partial") return null;

  if (state === "empty") {
    const total = isNum(input.questionCount) ? input.questionCount : 0;
    if (total < 0 || total > MAX_QUESTIONS_PER_CELL) return null;
    return {
      questionCount: total,
      correctCount: null,
      wrongCount: null,
      blankCount: null,
    };
  }

  const correct = input.correctCount as number;
  const wrong = input.wrongCount as number;
  const blank = input.blankCount as number;
  if ([correct, wrong, blank].some((n) => n < 0)) return null;
  const total = correct + wrong + blank;
  if (total > MAX_QUESTIONS_PER_CELL) return null;

  return {
    questionCount: total,
    correctCount: correct,
    wrongCount: wrong,
    blankCount: blank,
  };
}

/**
 * Bir kırılımın neti — `computeNet` ile, bölen `exam_sections`'tan gelir
 * (LGS 3, YKS/KPSS 4). Kırılım yoksa net hesaplanamaz → null.
 *
 * Not: mock sonuçlarının aksine burada net SAKLANMAZ, okuma anında
 * hesaplanır; bu bir çalışma kaydıdır, sınav sonucu değil.
 */
export function entryNet(
  entry: Pick<NormalizedQuestionEntry, "correctCount" | "wrongCount">,
  divisor: number,
): number | null {
  if (!isNum(entry.correctCount) || !isNum(entry.wrongCount)) return null;
  return computeNet(entry.correctCount, entry.wrongCount, divisor);
}

/**
 * Doğruluk yüzdesi = doğru / (doğru + yanlış). Boşlar paydaya girmez —
 * "çözdüğünün ne kadarını bildin" sorusunun cevabı bu. Hiç işaretlenmemişse
 * (D+Y = 0) null.
 */
export function accuracyPct(correct: number, wrong: number): number | null {
  const attempted = correct + wrong;
  if (attempted <= 0) return null;
  return Math.round((correct / attempted) * 100);
}
