import { and, eq } from "drizzle-orm";
import type { DB } from "@/db";
import { aiProposals, transcripts } from "@/db/schema";
import { chunkForD1 } from "@/lib/d1";
import { extractFromTranscript } from "@/lib/ai/extraction";
import type { SessionUser } from "@/actions/_guard";

/**
 * Transkript ingest + çıkarım ÇEKİRDEĞİ (paylaşılan iç mantık).
 *
 * Bu modül `"use server"` DEĞİLDİR — bu yüzden action-olmayan yardımcılar
 * export edebilir ve hem cookie Server Action'ları (`createPastedTranscript`,
 * `runTranscriptExtraction`) hem de bearer route handler'ı (tarayıcı eklentisi)
 * aynı çekirdeği çağırır; yazma mantığı tek yerde.
 *
 * GÜVENLİK: çekirdek yetki DENETLEMEZ. Çağıran ÖNCE `assertEnrollmentAccess`
 * (ve kimlik doğrulama) çalıştırmış olmalıdır. Çekirdek yalnız `transcripts` +
 * taslak `aiProposals` (status='proposed') yazar; hiçbir takip tablosuna
 * dokunmaz — invaryant korunur.
 */

export type InsertTranscriptCoreInput = {
  enrollmentId: number;
  coachingSessionId?: number | null;
  rawText: string;
  source: "paste" | "live";
  language?: string;
};

/**
 * Transkript satırını yazar (status='transcribed', consent='granted').
 * Yapıştırılan/canlı metin bir ses kaydı değildir; KVKK ses-kaydı onayı bu
 * yola uygulanmaz. Çağıran önce `assertEnrollmentAccess` yapmış olmalı.
 */
export async function insertTranscriptCore(
  db: DB,
  input: InsertTranscriptCoreInput,
  coachUser: SessionUser,
): Promise<{ transcriptId: number }> {
  const wordCount = input.rawText.split(/\s+/).filter(Boolean).length;
  const [row] = await db
    .insert(transcripts)
    .values({
      enrollmentId: input.enrollmentId,
      coachingSessionId: input.coachingSessionId ?? null,
      source: input.source,
      rawText: input.rawText,
      language: input.language ?? "tr",
      wordCount,
      status: "transcribed",
      consentState: "granted",
      createdByUserId: coachUser.id,
    })
    .returning({ id: transcripts.id });
  return { transcriptId: row.id };
}

/**
 * Var olan transkriptten öneri çıkarır (idempotent): bekleyen 'proposed'
 * önerileri siler, yeniden üretir, transcript status'ünü 'extracted' yapar
 * (hata olursa 'failed' + errorMessage yazıp yeniden fırlatır). Öneriler YALNIZ
 * taslaktır. Çağıran önce transkriptin enrollment'ına erişimi assert etmeli.
 */
export async function runExtractionCore(
  db: DB,
  transcriptId: number,
): Promise<{ proposalCount: number }> {
  const t = await db.query.transcripts.findFirst({
    where: eq(transcripts.id, transcriptId),
  });
  if (!t) throw new Error("Transkript bulunamadı.");
  if (!t.rawText?.trim()) throw new Error("Transkript metni boş.");

  try {
    const result = await extractFromTranscript({
      enrollmentId: t.enrollmentId,
      transcriptText: t.rawText,
    });

    await db
      .delete(aiProposals)
      .where(
        and(
          eq(aiProposals.transcriptId, transcriptId),
          eq(aiProposals.status, "proposed"),
        ),
      );

    // Satır başına 9 `?` — uzun görüşmelerde öneri sayısı D1'in 100 parametre
    // sınırını aşabiliyor, o yüzden parçalanıyor.
    for (const part of chunkForD1(result.proposals, 9)) {
      await db.insert(aiProposals).values(
        part.map((p) => ({
          transcriptId,
          enrollmentId: t.enrollmentId,
          kind: p.kind,
          // Date -> ISO string; apply anında action'ın coerce.date'i geri çevirir.
          payloadJson: JSON.stringify(p.payload),
          sourceQuote: p.sourceQuote ?? null,
          confidence: p.confidence ?? null,
          status: "proposed" as const,
        })),
      );
    }

    await db
      .update(transcripts)
      .set({
        digest: result.digest || null,
        status: "extracted",
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(transcripts.id, transcriptId));

    return { proposalCount: result.proposals.length };
  } catch (e) {
    await db
      .update(transcripts)
      .set({
        status: "failed",
        errorMessage: e instanceof Error ? e.message.slice(0, 500) : null,
        updatedAt: new Date(),
      })
      .where(eq(transcripts.id, transcriptId));
    throw e;
  }
}
