import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { getEnv } from "@/db";

/**
 * OpenRouter istemcisi — tüm AI (transkript + LLM) tek anahtardan geçer.
 *
 * Model kimlikleri: bilinçli olarak UCUZ AÇIK modeller (bütçe ~$5-15/ay). Türkçe
 * kalite yetersiz kalırsa KAÇIŞ KAPISI tek satır: aşağıdaki slug'ı bir frontier
 * modelle değiştirin (ör. "anthropic/claude-haiku-4.5") — entegrasyon değişmez.
 */
export const AI_MODELS = {
  /** Transkript -> yapılandırılmış öneri çıkarımı (doğruluk kritik). */
  extraction: "meta-llama/llama-3.3-70b-instruct",
  /** Öğrenci yolculuk sohbeti. */
  chat: "meta-llama/llama-3.3-70b-instruct",
  /** Koç ajanı (araç çağırma). */
  agent: "meta-llama/llama-3.3-70b-instruct",
  /** Ses -> metin (Türkçe). */
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
