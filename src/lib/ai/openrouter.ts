import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { getEnv } from "@/db";

/**
 * OpenRouter istemcisi — tüm AI (transkript + LLM) tek anahtardan geçer.
 *
 * Metin LLM'leri Claude Haiku 4.5'te birleşik: hız + Türkçe kalitesi +
 * güvenilir araç çağırma. Bütçe için tekrar ucuz açık modele dönmek isteyen
 * ilgili slug'ı "meta-llama/llama-3.3-70b-instruct" yapar — entegrasyon değişmez.
 */
export const AI_MODELS = {
  /** Transkript -> yapılandırılmış öneri çıkarımı (doğruluk kritik). */
  extraction: "anthropic/claude-haiku-4.5",
  /** Öğrenci yolculuk sohbeti. */
  chat: "anthropic/claude-haiku-4.5",
  /** Koç ajanı (araç çağırma). İnteraktif — hız + güvenilir araç çağırma. */
  agent: "anthropic/claude-haiku-4.5",
  /** Ses -> metin (Türkçe) — ayrı ses modeli; Haiku ses işleyemez. */
  whisper: "openai/whisper-large-v3-turbo",
} as const;

function apiKey(): string {
  const key = getEnv().OPENROUTER_API_KEY;
  if (!key) {
    throw new Error(
      "OPENROUTER_API_KEY tanımlı değil (.dev.vars ya da `wrangler secret put`).",
    );
  }
  return key;
}

/**
 * AI SDK dil modeli — generateText / generateObject / streamText / ToolLoopAgent
 * için. Varsayılan: çıkarım modeli.
 */
export function chatModel(modelId: string = AI_MODELS.extraction) {
  return createOpenRouter({ apiKey: apiKey() }).chat(modelId);
}

/**
 * OpenRouter Whisper — `/audio/transcriptions` (AI SDK dışı REST).
 *
 * NOT (Faz-0 sınırı): OpenRouter istek başına ~1 dk sesi aşınca zaman aşımına
 * uğrayabilir; multipart 25 MB ile sınırlı. Uzun görüşmeler yükleme öncesi
 * parçalara bölünmeli (bkz. transkript hattı). Bu yardımcı TEK bir parçayı çevirir.
 */
export async function transcribeChunk(
  bytes: ArrayBuffer,
  format: string,
  language = "tr",
): Promise<string> {
  const form = new FormData();
  form.append(
    "file",
    new Blob([bytes], { type: `audio/${format}` }),
    `chunk.${format}`,
  );
  form.append("model", AI_MODELS.whisper);
  form.append("language", language);

  const res = await fetch(
    "https://openrouter.ai/api/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey()}` },
      body: form,
    },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Transkript hatası (${res.status}): ${detail.slice(0, 300)}`,
    );
  }
  const json = (await res.json()) as { text?: string };
  return json.text ?? "";
}
