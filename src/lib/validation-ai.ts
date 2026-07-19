import { z } from "zod";
import {
  createMockSchema,
  planTaskCreateSchema,
  questionLogUpsertSchema,
  updateSessionSchema,
} from "@/lib/validation";
import { toggleTopicResourceSchema } from "@/lib/validation-konular";

/**
 * AI çıkarım katmanının SÖZLEŞMESİ (HITL güven çıpası).
 *
 * Her öneri türü mevcut bir Server Action girdisine karşılık gelir; öneri
 * yükü (payload) o action'ın Zod şemasının AYNISIDIR — böylece onay anında
 * `reconstructActionInput()` + mevcut action `.safeParse()` birebir geçer ve
 * AI yeni bir yazma yolu ya da yeni bir formül ekleyemez.
 *
 * GÜVENLİK: `enrollmentId` (ve session_note_update için `sessionId`) modele
 * ASLA ürettirilmez — transkript kaydından (güvenilir bağlam) server-side
 * enjekte edilir. Bu yüzden modele dönük şemalarda bu id'ler `.omit()` edilir.
 */

/** Öneri türü → uygulayan mevcut Server Action. */
export const AI_PROPOSAL_KINDS = [
  "question_log_upsert", // -> upsertQuestionLogs (actions/tracking.ts)
  "mock_exam_create", // -> createMock (actions/tracking.ts)
  "plan_task_create", // -> createPlanTask (actions/plans.ts)
  "topic_progress_update", // -> toggleTopicResourceDone (actions/konular.ts)
  "session_note_update", // -> updateSession (actions/sessions.ts)
] as const;
export type AiProposalKind = (typeof AI_PROPOSAL_KINDS)[number];

/* -------------------------------------------------------------------------- */
/*  Modele dönük yük şemaları (güvenilir id'ler çıkarılmış)                    */
/* -------------------------------------------------------------------------- */

export const questionLogAiPayloadSchema = questionLogUpsertSchema.omit({
  enrollmentId: true,
});
export const mockExamAiPayloadSchema = createMockSchema.omit({
  enrollmentId: true,
});
export const planTaskAiPayloadSchema = planTaskCreateSchema.omit({
  enrollmentId: true,
});
export const topicProgressAiPayloadSchema = toggleTopicResourceSchema.omit({
  enrollmentId: true,
});
/** Görüşme notu: model yalnız durum/not alanlarını önerir; sessionId enjekte edilir. */
export const sessionNoteAiPayloadSchema = updateSessionSchema.omit({
  sessionId: true,
  scheduledAt: true,
  nextPlanId: true,
});

/* -------------------------------------------------------------------------- */
/*  Öneri + çıkarım sonucu                                                     */
/* -------------------------------------------------------------------------- */

const proposalMeta = {
  /** Öneriyi haklı çıkaran birebir Türkçe transkript alıntısı. */
  sourceQuote: z.string().trim().max(1000).optional(),
  confidence: z.number().min(0).max(1).optional(),
};

export const aiProposalSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("question_log_upsert"),
    payload: questionLogAiPayloadSchema,
    ...proposalMeta,
  }),
  z.object({
    kind: z.literal("mock_exam_create"),
    payload: mockExamAiPayloadSchema,
    ...proposalMeta,
  }),
  z.object({
    kind: z.literal("plan_task_create"),
    payload: planTaskAiPayloadSchema,
    ...proposalMeta,
  }),
  z.object({
    kind: z.literal("topic_progress_update"),
    payload: topicProgressAiPayloadSchema,
    ...proposalMeta,
  }),
  z.object({
    kind: z.literal("session_note_update"),
    payload: sessionNoteAiPayloadSchema,
    ...proposalMeta,
  }),
]);
export type AiProposal = z.infer<typeof aiProposalSchema>;

/** Bir transkriptten çıkan tam sonuç: özet + öneri listesi. */
export const extractionResultSchema = z.object({
  digest: z.string().trim().max(4000),
  proposals: z.array(aiProposalSchema).max(50),
});
export type ExtractionResult = z.infer<typeof extractionResultSchema>;

/* -------------------------------------------------------------------------- */
/*  Güvenilir bağlam enjeksiyonu (onay anında)                                 */
/* -------------------------------------------------------------------------- */

export type ProposalApplyContext = {
  /** Transkriptin enrollment'ı — modelden değil, kayıttan gelir. */
  enrollmentId: number;
  /** session_note_update için transkriptin bağlı olduğu görüşme id'si. */
  sessionId?: number | null;
};

/**
 * Modele dönük yükü + güvenilir id'leri birleştirip HEDEF ACTION'ın beklediği
 * girdiyi üretir. Dönen değer bilinçli olarak `unknown` — çağıran, ilgili
 * mevcut action'ın kendi Zod şemasıyla `.safeParse()` ederek round-trip'i
 * garanti eder (sözleşmenin tek doğruluk kaynağı action'ın kendisidir).
 */
export function reconstructActionInput(
  proposal: AiProposal,
  ctx: ProposalApplyContext,
): unknown {
  switch (proposal.kind) {
    case "question_log_upsert":
    case "mock_exam_create":
    case "plan_task_create":
    case "topic_progress_update":
      return { ...proposal.payload, enrollmentId: ctx.enrollmentId };
    case "session_note_update":
      return { ...proposal.payload, sessionId: ctx.sessionId };
  }
}
