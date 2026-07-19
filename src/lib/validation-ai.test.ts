import { describe, expect, it } from "vitest";
import {
  createMockSchema,
  planTaskCreateSchema,
  questionLogUpsertSchema,
  updateSessionSchema,
} from "./validation";
import { toggleTopicResourceSchema } from "./validation-konular";
import {
  aiProposalSchema,
  extractionResultSchema,
  reconstructActionInput,
  type AiProposal,
} from "./validation-ai";

const ENROLLMENT_ID = 7;
const SESSION_ID = 42;

/** Modelden gelen ham öneri → parse → id enjeksiyonu → HEDEF action şeması. */
function roundTrips(
  raw: unknown,
  targetSchema: { safeParse: (v: unknown) => { success: boolean } },
  sessionId?: number,
): boolean {
  const parsed = aiProposalSchema.parse(raw);
  const input = reconstructActionInput(parsed, {
    enrollmentId: ENROLLMENT_ID,
    sessionId,
  });
  return targetSchema.safeParse(input).success;
}

describe("AI proposal payloads round-trip through the existing action schemas", () => {
  it("question_log_upsert -> questionLogUpsertSchema", () => {
    const raw = {
      kind: "question_log_upsert",
      sourceQuote: "Salı 120 matematik sorusu çözdüm",
      confidence: 0.9,
      payload: {
        logDate: "2026-07-14",
        entries: [{ subjectId: 12, questionCount: 120 }],
      },
    };
    expect(roundTrips(raw, questionLogUpsertSchema)).toBe(true);
  });

  it("mock_exam_create -> createMockSchema", () => {
    const raw = {
      kind: "mock_exam_create",
      payload: {
        examSectionId: 3,
        scope: "full",
        takenOn: "2026-07-15",
        results: [
          { subjectId: 12, correctCount: 30, wrongCount: 8, blankCount: 2 },
        ],
      },
    };
    expect(roundTrips(raw, createMockSchema)).toBe(true);
  });

  it("plan_task_create -> planTaskCreateSchema", () => {
    const raw = {
      kind: "plan_task_create",
      payload: {
        weekStart: "2026-07-13",
        day: 2,
        subjectId: 12,
        description: "50 paragraf sorusu",
        targetQuestions: 50,
      },
    };
    expect(roundTrips(raw, planTaskCreateSchema)).toBe(true);
  });

  it("topic_progress_update -> toggleTopicResourceSchema", () => {
    const raw = {
      kind: "topic_progress_update",
      payload: { topicId: 5, resourceId: 9, isDone: true },
    };
    expect(roundTrips(raw, toggleTopicResourceSchema)).toBe(true);
  });

  it("session_note_update -> updateSessionSchema (sessionId injected)", () => {
    const raw = {
      kind: "session_note_update",
      payload: { summary: "Bu hafta türev konusuna ağırlık verildi.", status: "held" },
    };
    expect(roundTrips(raw, updateSessionSchema, SESSION_ID)).toBe(true);
  });
});

describe("trusted-id safety", () => {
  it("strips any model-supplied enrollmentId and injects the trusted one", () => {
    const raw = {
      kind: "question_log_upsert",
      payload: {
        // Model tries to target a different enrollment — must be ignored.
        enrollmentId: 999,
        logDate: "2026-07-14",
        entries: [{ subjectId: 12, questionCount: 10 }],
      },
    };
    const parsed = aiProposalSchema.parse(raw) as Extract<
      AiProposal,
      { kind: "question_log_upsert" }
    >;
    // enrollmentId was not part of the model-facing schema -> stripped.
    expect("enrollmentId" in parsed.payload).toBe(false);
    const input = reconstructActionInput(parsed, {
      enrollmentId: ENROLLMENT_ID,
    }) as { enrollmentId: number };
    expect(input.enrollmentId).toBe(ENROLLMENT_ID);
  });
});

describe("bounds are enforced before apply", () => {
  it("rejects a questionCount over the max", () => {
    const raw = {
      kind: "question_log_upsert",
      payload: {
        logDate: "2026-07-14",
        entries: [{ subjectId: 12, questionCount: 9999 }],
      },
    };
    expect(aiProposalSchema.safeParse(raw).success).toBe(false);
  });

  it("rejects an unknown proposal kind", () => {
    const raw = { kind: "delete_student", payload: {} };
    expect(aiProposalSchema.safeParse(raw).success).toBe(false);
  });
});

describe("extractionResultSchema", () => {
  it("accepts a digest + a list of valid proposals", () => {
    const raw = {
      digest: "Görüşmede matematik denemesi ve haftalık plan konuşuldu.",
      proposals: [
        {
          kind: "question_log_upsert",
          payload: {
            logDate: "2026-07-14",
            entries: [{ subjectId: 12, questionCount: 120 }],
          },
        },
      ],
    };
    expect(extractionResultSchema.safeParse(raw).success).toBe(true);
  });
});
