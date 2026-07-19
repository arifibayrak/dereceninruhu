"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, getR2 } from "@/db";
import { aiProposals, transcripts } from "@/db/schema";
import { extractFromTranscript } from "@/lib/ai/extraction";
import { transcribeChunk } from "@/lib/ai/openrouter";
import {
  aiProposalSchema,
  reconstructActionInput,
  type AiProposalKind,
} from "@/lib/validation-ai";
import { createMock, upsertQuestionLogs } from "@/actions/tracking";
import { addPlanTask } from "@/actions/plans";
import { toggleTopicResourceDone } from "@/actions/konular";
import { updateSession } from "@/actions/sessions";
import {
  actionError,
  fieldErrorsOf,
  guarded,
  requireCoach,
  type ActionResult,
} from "@/actions/_guard";
import { assertEnrollmentAccess } from "@/actions/_access";

/** Öneri türünü mevcut Server Action'a yönlendirir (tek yazma yolu burasıdır). */
function applyToTargetAction(
  kind: AiProposalKind,
  input: unknown,
): Promise<ActionResult<unknown>> {
  switch (kind) {
    case "question_log_upsert":
      return upsertQuestionLogs(input);
    case "mock_exam_create":
      return createMock(input);
    case "plan_task_create":
      return addPlanTask(input);
    case "topic_progress_update":
      return toggleTopicResourceDone(input);
    case "session_note_update":
      return updateSession(input);
  }
}

/** Koç, Meet/Zoom dökümünü yapıştırır (ses yolu ayrı; bu metin tabanlı). */
const pasteSchema = z.object({
  enrollmentId: z.coerce.number().int().positive(),
  coachingSessionId: z.coerce.number().int().positive().nullish(),
  rawText: z.string().trim().min(20, "Transkript çok kısa.").max(200_000),
});

export async function createPastedTranscript(
  input: unknown,
): Promise<ActionResult<{ transcriptId: number }>> {
  return guarded(async () => {
    const user = await requireCoach();
    const parsed = pasteSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const { enrollmentId, coachingSessionId, rawText } = parsed.data;
    const db = getDb();
    await assertEnrollmentAccess(db, enrollmentId, user);

    const wordCount = rawText.split(/\s+/).filter(Boolean).length;
    const [row] = await db
      .insert(transcripts)
      .values({
        enrollmentId,
        coachingSessionId: coachingSessionId ?? null,
        source: "paste",
        rawText,
        language: "tr",
        wordCount,
        status: "transcribed",
        // Yapıştırılan metin bir ses kaydı değil; KVKK ses-kaydı onayı bu yola uygulanmaz.
        consentState: "granted",
        createdByUserId: user.id,
      })
      .returning({ id: transcripts.id });

    return { ok: true, data: { transcriptId: row.id } };
  });
}

/* -------------------------------------------------------------------------- */
/*  Ses yolu: kayıt yükle -> R2 + Whisper (parça parça) -> transkript          */
/*  Parçalama istemcide yapılır (16 kHz mono WAV); burada her parça R2'ye       */
/*  yazılır ve OpenRouter Whisper ile çevrilir.                                 */
/* -------------------------------------------------------------------------- */

const createAudioSchema = z.object({
  enrollmentId: z.coerce.number().int().positive(),
  coachingSessionId: z.coerce.number().int().positive().nullish(),
  /** KVKK: ses kaydı için (reşit değilse veli) onayı alındı mı. */
  consentGranted: z.boolean(),
});

export async function createAudioTranscript(
  input: unknown,
): Promise<ActionResult<{ transcriptId: number }>> {
  return guarded(async () => {
    const user = await requireCoach();
    const parsed = createAudioSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const { enrollmentId, coachingSessionId, consentGranted } = parsed.data;
    if (!consentGranted) {
      return actionError("Kayıt için öğrenci/veli onayı gerekli (KVKK).");
    }
    const db = getDb();
    await assertEnrollmentAccess(db, enrollmentId, user);

    const [row] = await db
      .insert(transcripts)
      .values({
        enrollmentId,
        coachingSessionId: coachingSessionId ?? null,
        source: "audio",
        language: "tr",
        status: "transcribing",
        consentState: "granted",
        createdByUserId: user.id,
      })
      .returning({ id: transcripts.id });
    return { ok: true, data: { transcriptId: row.id } };
  });
}

const chunkSchema = z.object({
  transcriptId: z.coerce.number().int().positive(),
  chunkIndex: z.coerce.number().int().min(0),
  dataBase64: z.string().min(1),
});

/** Bir WAV parçasını R2'ye yaz + Whisper ile çevir; metnini döndür. */
export async function transcribeAudioChunk(
  input: unknown,
): Promise<ActionResult<{ text: string }>> {
  return guarded(async () => {
    const user = await requireCoach();
    const parsed = chunkSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz parça.");
    const { transcriptId, chunkIndex, dataBase64 } = parsed.data;
    const db = getDb();
    const t = await db.query.transcripts.findFirst({
      where: eq(transcripts.id, transcriptId),
    });
    if (!t) return actionError("Transkript bulunamadı.");
    await assertEnrollmentAccess(db, t.enrollmentId, user);

    const bytes = Buffer.from(dataBase64, "base64");
    const key = `transcripts/${transcriptId}/chunk-${String(chunkIndex).padStart(4, "0")}.wav`;
    await getR2().put(key, bytes);

    const ab = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    const text = await transcribeChunk(ab, "wav", "tr");
    return { ok: true, data: { text } };
  });
}

const saveAudioSchema = z.object({
  transcriptId: z.coerce.number().int().positive(),
  fullText: z.string().trim().min(1).max(500_000),
});

/** Parçaların birleşik metnini transkripte yaz; çıkarıma hazır hale getir. */
export async function saveAudioTranscript(
  input: unknown,
): Promise<ActionResult<{ transcriptId: number }>> {
  return guarded(async () => {
    const user = await requireCoach();
    const parsed = saveAudioSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const { transcriptId, fullText } = parsed.data;
    const db = getDb();
    const t = await db.query.transcripts.findFirst({
      where: eq(transcripts.id, transcriptId),
    });
    if (!t) return actionError("Transkript bulunamadı.");
    await assertEnrollmentAccess(db, t.enrollmentId, user);

    await db
      .update(transcripts)
      .set({
        rawText: fullText,
        wordCount: fullText.split(/\s+/).filter(Boolean).length,
        audioR2Key: `transcripts/${transcriptId}/`,
        status: "transcribed",
        updatedAt: new Date(),
      })
      .where(eq(transcripts.id, transcriptId));
    return { ok: true, data: { transcriptId } };
  });
}

/**
 * Transkriptten öneri çıkar (idempotent): önce bekleyen 'proposed' önerileri
 * temizler, sonra yeniden üretir. Öneriler YALNIZ taslaktır — hiçbir takip
 * tablosuna yazılmaz; koç inceleyip `applyProposal` ile onaylar (Faz #6).
 */
export async function runTranscriptExtraction(
  transcriptId: number,
): Promise<ActionResult<{ proposalCount: number }>> {
  return guarded(async () => {
    const user = await requireCoach();
    const db = getDb();
    const t = await db.query.transcripts.findFirst({
      where: eq(transcripts.id, transcriptId),
    });
    if (!t) return actionError("Transkript bulunamadı.");
    await assertEnrollmentAccess(db, t.enrollmentId, user);
    if (!t.rawText?.trim()) return actionError("Transkript metni boş.");

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

      if (result.proposals.length > 0) {
        await db.insert(aiProposals).values(
          result.proposals.map((p) => ({
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

      return { ok: true, data: { proposalCount: result.proposals.length } };
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
  });
}

/**
 * Öneriyi ONAYLA: güvenilir id'leri enjekte edip MEVCUT action'ı çağırır.
 * `editedPayload` verilirse koçun düzenlediği yük kullanılır. Yazma yalnız
 * hedef action'dan geçer (net orada hesaplanır, yetki orada tekrar denetlenir).
 */
export async function applyProposal(
  proposalId: number,
  editedPayload?: unknown,
): Promise<ActionResult<{ applied: true }>> {
  return guarded(async () => {
    const user = await requireCoach();
    const db = getDb();
    const proposal = await db.query.aiProposals.findFirst({
      where: eq(aiProposals.id, proposalId),
    });
    if (!proposal) return actionError("Öneri bulunamadı.");
    await assertEnrollmentAccess(db, proposal.enrollmentId, user);
    if (proposal.status === "applied") {
      return actionError("Bu öneri zaten uygulandı.");
    }

    // session_note_update için görüşme id'si transkriptten gelir (modelden değil).
    const t = await db.query.transcripts.findFirst({
      where: eq(transcripts.id, proposal.transcriptId),
    });
    const sessionId = t?.coachingSessionId ?? null;

    let payload: unknown;
    try {
      payload = editedPayload ?? JSON.parse(proposal.payloadJson);
    } catch {
      return actionError("Öneri yükü okunamadı.");
    }

    // Düzenlenmiş yükü de sözleşmeye göre yeniden doğrula.
    const validated = aiProposalSchema.safeParse({
      kind: proposal.kind,
      payload,
    });
    if (!validated.success) {
      return actionError(
        "Öneri geçerli değil.",
        fieldErrorsOf(validated.error.issues),
      );
    }
    if (validated.data.kind === "session_note_update" && !sessionId) {
      return actionError(
        "Bu transkript bir görüşmeye bağlı değil; not güncellenemez.",
      );
    }

    const targetInput = reconstructActionInput(validated.data, {
      enrollmentId: proposal.enrollmentId,
      sessionId,
    });
    const result = await applyToTargetAction(validated.data.kind, targetInput);

    if (!result.ok) {
      await db
        .update(aiProposals)
        .set({
          status: "failed",
          resultJson: JSON.stringify({ error: result.error }),
          reviewedByUserId: user.id,
          updatedAt: new Date(),
        })
        .where(eq(aiProposals.id, proposalId));
      return actionError(result.error);
    }

    await db
      .update(aiProposals)
      .set({
        status: "applied",
        resultJson: JSON.stringify(result.data),
        reviewedByUserId: user.id,
        appliedAt: new Date(),
        payloadJson: JSON.stringify(payload),
        updatedAt: new Date(),
      })
      .where(eq(aiProposals.id, proposalId));

    return { ok: true, data: { applied: true } };
  });
}

/** Öneriyi REDDET (hiçbir yazma olmaz; iz kalır). */
export async function rejectProposal(
  proposalId: number,
): Promise<ActionResult<{ rejected: true }>> {
  return guarded(async () => {
    const user = await requireCoach();
    const db = getDb();
    const proposal = await db.query.aiProposals.findFirst({
      where: eq(aiProposals.id, proposalId),
    });
    if (!proposal) return actionError("Öneri bulunamadı.");
    await assertEnrollmentAccess(db, proposal.enrollmentId, user);
    await db
      .update(aiProposals)
      .set({
        status: "rejected",
        reviewedByUserId: user.id,
        updatedAt: new Date(),
      })
      .where(eq(aiProposals.id, proposalId));
    return { ok: true, data: { rejected: true } };
  });
}
