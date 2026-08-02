import { generateText } from "ai";
import { recordAiUsage } from "@/lib/ai/usage";
import { z } from "zod";
import { chatModel, AI_MODELS } from "./openrouter";
import { buildGroundingText } from "./grounding";
import { getPlanForReuse, listWeeklyPlans } from "@/db/queries/plans";
import { formatTrDate, mondayOf, trDayKey } from "@/lib/dates";

/**
 * AI ile HAFTALIK PROGRAM (ders × konu) TASLAĞI üretimi.
 *
 * extraction.ts ile aynı model-bağımsız yaklaşım: JSON-only prompt -> gevşek
 * ayrıştırma -> Zod doğrulama -> bir kez yeniden dene. Sonuç HİÇBİR ŞEY YAZMAZ;
 * koç/öğrenci gözden geçirip onaylayınca mevcut `addPlanTask` yoluyla yazılır
 * (HITL). Model yalnızca verilen ders id'lerini kullanabilir; uymayan subjectId
 * null'a çekilir.
 */

const SYSTEM = `Sen bir Türk sınav-hazırlık koçluk platformunun PROGRAM asistanısın.
Görevin: bir öğrenci için DENGELİ, GERÇEKÇİ bir HAFTALIK ÇALIŞMA PROGRAMI
önermek — ders × konu düzeninde.

KATI KURALLAR:
- SADECE geçerli JSON döndür. Markdown, açıklama, kod bloğu YOK.
- "subjectId" için YALNIZCA "KULLANILABİLİR DERSLER" listesindeki id'leri kullan.
  Uygun ders yoksa subjectId = null. ID UYDURMA.
- Konuları öğrencinin ZAYIF konularına, hedefine ve geçmiş programlarına göre seç.
  Geçmiş haftaları AYNEN tekrar etme; eksik kalanları tamamla, üstüne kur.
- Her konu KISA ve NET olsun ("description"). İstersen bir güne ata ("day" 1-7),
  istersen haftalık bırak ("day" null).
- GERÇEKÇİ ol: hafta genelinde ~10-20 konu; her derse birkaç konu düşsün. Aşırı
  yükleme yapma.
- "targetQuestions" opsiyonel (0-2000).
- Türkçe yaz.

ÇIKTI ŞEMASI:
{
  "motto": "<opsiyonel kısa motto>",
  "note": "<opsiyonel 1-3 cümlelik strateji notu>",
  "topics": [
    { "subjectId": <ders id ya da null>, "day": <1-7 ya da null>,
      "description": "<konu>", "targetQuestions": <0-2000 ya da null> }
  ]
}`;

const genTopicSchema = z.object({
  subjectId: z.coerce.number().int().positive().nullish(),
  day: z.coerce.number().int().min(1).max(7).nullish(),
  description: z.string().trim().min(1).max(300),
  targetQuestions: z.coerce.number().int().min(0).max(2000).nullish(),
});

const genResultSchema = z.object({
  motto: z.string().trim().max(200).nullish(),
  note: z.string().trim().max(2000).nullish(),
  topics: z.array(genTopicSchema).max(40),
});

export type ProgramDraftTopic = {
  subjectId: number | null;
  day: number | null;
  description: string;
  targetQuestions: number | null;
};
export type ProgramDraft = {
  motto: string | null;
  note: string | null;
  topics: ProgramDraftTopic[];
};

/** Model çıktısından JSON'u gevşek ayrıştır + Zod ile doğrula. */
function parseDraft(text: string): z.infer<typeof genResultSchema> | null {
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
  const parsed = genResultSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Geçmiş programların kısa özeti — AI'nın "eskiyi görüp yeniyi öner"mesi için. */
async function pastPlansDigest(
  enrollmentId: number,
  targetMonday: Date,
): Promise<string> {
  const weeks = await listWeeklyPlans(enrollmentId, 4);
  const past = weeks
    .filter((w) => w.weekStart.getTime() < targetMonday.getTime())
    .slice(0, 3);
  if (past.length === 0) return "(geçmiş program yok)";
  const lines: string[] = [];
  for (const w of past) {
    const tasks = await getPlanForReuse(enrollmentId, w.weekStart);
    const topics = tasks
      .map((t) => t.description)
      .filter((d): d is string => Boolean(d && d.trim()))
      .slice(0, 12);
    lines.push(
      `- ${formatTrDate(w.weekStart)} (${w.status}): ${topics.join("; ") || "-"}`,
    );
  }
  return lines.join("\n");
}

export async function generateProgramDraft(params: {
  enrollmentId: number;
  weekStart: Date;
  focus?: string | null;
  subjects: { id: number; name: string }[];
}): Promise<ProgramDraft> {
  const targetMonday = mondayOf(params.weekStart);
  const [grounding, past] = await Promise.all([
    buildGroundingText(params.enrollmentId),
    pastPlansDigest(params.enrollmentId, targetMonday),
  ]);

  const subjectList =
    params.subjects.map((s) => `${s.id} -> ${s.name}`).join("\n") || "(yok)";
  const allowed = new Set(params.subjects.map((s) => s.id));

  const prompt = `${grounding}

=== KULLANILABİLİR DERSLER (id -> ad) ===
${subjectList}

=== GEÇMİŞ PROGRAMLAR ===
${past}

=== HEDEF HAFTA ===
${trDayKey(targetMonday)} (pazartesi).${
    params.focus ? ` İstek: ${params.focus}` : ""
  }

=== GÖREV ===
Yukarıdaki şemaya göre bu hafta için SADECE JSON program üret.`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const { text, usage } = await generateText({
      model: chatModel(AI_MODELS.agent),
      system: SYSTEM,
      prompt,
      temperature: 0.3,
    });
    await recordAiUsage({
      feature: "program-taslak",
      model: AI_MODELS.agent,
      usage,
    });
    const parsed = parseDraft(text);
    if (parsed) {
      return {
        motto: parsed.motto ?? null,
        note: parsed.note ?? null,
        topics: parsed.topics.map((t) => ({
          // Uymayan subjectId'yi null'a çek (model yanlış ders seçmesin).
          subjectId:
            t.subjectId != null && allowed.has(t.subjectId) ? t.subjectId : null,
          day: t.day ?? null,
          description: t.description,
          targetQuestions: t.targetQuestions ?? null,
        })),
      };
    }
  }
  return { motto: null, note: null, topics: [] };
}
