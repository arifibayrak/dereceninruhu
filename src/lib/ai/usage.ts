import { getDb } from "@/db";
import { aiUsageLog } from "@/db/schema";

/** Jetonu hangi özellik harcadı — panel kırılımı bunun üzerinden. */
export type AiFeature =
  | "program-taslak"
  | "koc-asistani"
  | "ogrenci-sohbet"
  | "transkript-cikarim"
  | "ekstre-cikarim"
  | "ses-metin";

/** AI SDK'nın `result.usage` alanı — sürümler arası alan adları değişebiliyor. */
type SdkUsage = {
  inputTokens?: number | null;
  outputTokens?: number | null;
  cachedInputTokens?: number | null;
} | null | undefined;

const say = (v: number | null | undefined) =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v) : 0;

/**
 * Bir model çağrısının jeton tüketimini kaydeder.
 *
 * **Asla fırlatmaz.** Bu bir muhasebe kaydı; yazımı başarısız olursa kullanıcının
 * özelliği (program taslağı, sohbet…) çalışmaya devam etmeli. Hata konsola
 * düşer, akış kesilmez.
 *
 * Fiyat burada hesaplanmaz — yalnız jeton yazılır; TL karşılığı okuma anında
 * `@/lib/maliyet` ile bulunur (bkz. schema'daki not).
 */
export async function recordAiUsage(input: {
  feature: AiFeature;
  model: string;
  usage?: SdkUsage;
  /** Ses modelleri için süre; verilirse jeton yerine bu ücretlendirilir. */
  audioSeconds?: number;
  enrollmentId?: number | null;
}): Promise<void> {
  try {
    const inputTokens = say(input.usage?.inputTokens);
    const outputTokens = say(input.usage?.outputTokens);
    const cachedInputTokens = say(input.usage?.cachedInputTokens);
    const audioSeconds = say(input.audioSeconds);
    // Tamamen boş bir çağrıyı kaydetmek gürültü — sayfada 0'lık satır çıkmasın.
    if (!inputTokens && !outputTokens && !cachedInputTokens && !audioSeconds) {
      return;
    }
    await getDb()
      .insert(aiUsageLog)
      .values({
        feature: input.feature,
        model: input.model,
        inputTokens,
        outputTokens,
        cachedInputTokens,
        audioSeconds: audioSeconds || null,
        enrollmentId: input.enrollmentId ?? null,
      });
  } catch (err) {
    console.error("[ai-usage] kaydedilemedi", err);
  }
}
