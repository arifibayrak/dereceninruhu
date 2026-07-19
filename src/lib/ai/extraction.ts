import { generateText } from "ai";
import { chatModel, AI_MODELS } from "./openrouter";
import { buildGroundingText } from "./grounding";
import { trDayKey } from "@/lib/dates";
import {
  extractionResultSchema,
  type ExtractionResult,
} from "@/lib/validation-ai";

/**
 * Transkript -> yapılandırılmış öneri çıkarımı.
 *
 * Açık modellerde katı structured-output güvenilmez olabildiği için yaklaşım
 * MODELDEN BAĞIMSIZDIR: JSON-only prompt -> gevşek JSON ayrıştırma -> Zod
 * doğrulama -> bir kez yeniden dene. Doğrulanan sonuç, mevcut action şemalarını
 * birebir yansıtan `extractionResultSchema`'dan geçer (bkz. validation-ai.ts).
 */

const SYSTEM = `Sen bir Türk sınav-hazırlık koçluk platformunun veri asistanısın.
Görevin: bir koç-öğrenci GÖRÜŞME TRANSKRİPTİNİ okuyup, koçun ONAYLAYACAĞI
yapılandırılmış TAKİP GÜNCELLEMELERİNİ öneri olarak çıkarmak.

KATI KURALLAR:
- SADECE geçerli JSON döndür. Markdown, açıklama, kod bloğu YOK.
- Ders/bölüm/konu/kaynak için YALNIZCA bağlamdaki (grounding) ID'leri kullan.
  ID uydurma. Eşleşen ID yoksa o öneriyi ATLA.
- Her önerinin "sourceQuote" alanı transkriptten BİREBİR Türkçe alıntı olsun.
- Emin değilsen öneri üretme. Somut bir şey yoksa "proposals": [] döndür.
- Tarihler "YYYY-MM-DD" biçiminde. enrollmentId/sessionId EKLEME (sunucu ekler).

ÇIKTI ŞEMASI:
{
  "digest": "görüşmenin 2-4 cümlelik Türkçe özeti",
  "proposals": [
    // Öğrencinin çözdüğü günlük soru sayıları:
    { "kind": "question_log_upsert", "sourceQuote": "...", "confidence": 0.0-1.0,
      "payload": { "logDate": "YYYY-MM-DD",
        "entries": [ { "subjectId": <ders id>, "questionCount": <0-2000> } ] } },
    // Girilen bir deneme sonucu (net SUNUCUDA hesaplanır, sen net gönderme):
    { "kind": "mock_exam_create", "sourceQuote": "...", "confidence": 0.0-1.0,
      "payload": { "examSectionId": <bölüm id>, "scope": "full"|"branch",
        "takenOn": "YYYY-MM-DD", "durationMinutes": <opsiyonel>,
        "results": [ { "subjectId": <PUANLANAN ders id>, "correctCount": <n>,
          "wrongCount": <n>, "blankCount": <n> } ] } },
    // Haftalık programa görev ekleme (weekStart pazartesi olmalı):
    { "kind": "plan_task_create", "sourceQuote": "...", "confidence": 0.0-1.0,
      "payload": { "weekStart": "YYYY-MM-DD", "day": <1-7>,
        "subjectId": <opsiyonel ders id>, "resourceId": <opsiyonel kaynak id>,
        "description": "<görev>", "targetQuestions": <opsiyonel 0-2000> } },
    // Konu x kaynak "bitti" işareti (hem topicId hem resourceId gerekli):
    { "kind": "topic_progress_update", "sourceQuote": "...", "confidence": 0.0-1.0,
      "payload": { "topicId": <konu id>, "resourceId": <kaynak id>, "isDone": true } },
    // Görüşme notu güncelleme (sessionId sunucudan gelir):
    { "kind": "session_note_update", "sourceQuote": "...", "confidence": 0.0-1.0,
      "payload": { "status": "held", "summary": "<koç notu>",
        "studentVisibleNote": "<öğrenci notu>" } }
  ]
}`;

/** Model çıktısından JSON'u gevşek ayrıştır + Zod ile doğrula. */
export function parseExtraction(text: string): ExtractionResult | null {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
  const parsed = extractionResultSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function extractFromTranscript(params: {
  enrollmentId: number;
  transcriptText: string;
}): Promise<ExtractionResult> {
  const grounding = await buildGroundingText(params.enrollmentId);
  const dateCtx = `BUGÜN: ${trDayKey(new Date())}. Transkriptteki göreli tarihleri ("dün", "salı", "bu hafta") buna göre YYYY-MM-DD'ye çevir.`;
  const prompt = `${dateCtx}\n\n${grounding}\n\n=== TRANSKRİPT ===\n${params.transcriptText}\n\n=== GÖREV ===\nYukarıdaki şemaya göre SADECE JSON üret.`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const { text } = await generateText({
      model: chatModel(AI_MODELS.extraction),
      system: SYSTEM,
      prompt,
      temperature: 0,
    });
    const parsed = parseExtraction(text);
    if (parsed) return parsed;
  }
  // İki denemede de geçerli JSON çıkmadı: boş sonuç (koç manuel girer).
  return { digest: "", proposals: [] };
}
