import { describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import {
  aiProposals,
  contentVisibility,
  mockExamResults,
  mockTopicErrors,
  planTasks,
  questionLogs,
} from "@/db/schema";
import { chunkForD1, D1_MAX_BOUND_PARAMS } from "@/lib/d1";

/**
 * D1 sorgu başına 100 bağlı parametre kabul eder. Toplu yazımlar bunu aşmasın
 * diye `chunkForD1(rows, paramsPerRow)` ile bölünüyor — ve `paramsPerRow`
 * ELLE yazılmış bir sayı. Bir tabloya sütun eklendiğinde bu sayı eskir ve hata
 * ancak canlıda, veri büyüdüğünde görünür (bkz. deneme konu analizi).
 *
 * Bu test gerçek INSERT'ü derleyip parametre sayısını ÖLÇER: aksiyonlardaki
 * bölen yanlışsa burada kırmızı yanar.
 */
const db = drizzle({} as unknown as D1Database, { schema });

const rowsOf = <T>(n: number, make: (i: number) => T): T[] =>
  Array.from({ length: n }, (_, i) => make(i));

/** Aksiyonlarda kullanılan bölen → o bölenle üretilen ilk parçanın maliyeti. */
const CASES = [
  {
    name: "mock_topic_errors (src/actions/analiz.ts)",
    paramsPerRow: 4,
    build: (n: number) =>
      db.insert(mockTopicErrors).values(
        rowsOf(n, (i) => ({ mockExamId: 1, topicId: i + 1, errorCount: 1 })),
      ),
  },
  {
    name: "question_logs (src/actions/tracking.ts)",
    paramsPerRow: 9,
    build: (n: number) =>
      db.insert(questionLogs).values(
        rowsOf(n, (i) => ({
          enrollmentId: 1,
          logDate: new Date(0),
          subjectId: i + 1,
          questionCount: 10,
          correctCount: 5,
          wrongCount: 3,
          blankCount: 2,
        })),
      ),
  },
  {
    name: "mock_exam_results (src/actions/tracking.ts)",
    paramsPerRow: 6,
    build: (n: number) =>
      db.insert(mockExamResults).values(
        rowsOf(n, (i) => ({
          mockExamId: 1,
          subjectId: i + 1,
          correctCount: 10,
          wrongCount: 2,
          blankCount: 1,
          net: 9.5,
        })),
      ),
  },
  {
    name: "content_visibility (src/actions/icerik.ts)",
    paramsPerRow: 3,
    build: (n: number) =>
      db.insert(contentVisibility).values(
        rowsOf(n, (i) => ({ contentItemId: 1, enrollmentId: i + 1 })),
      ),
  },
  {
    name: "plan_tasks (src/actions/plans.ts)",
    paramsPerRow: 10,
    build: (n: number) =>
      db.insert(planTasks).values(
        rowsOf(n, (i) => ({
          weeklyPlanId: 1,
          day: 1,
          slot: i,
          subjectId: 2,
          resourceId: null,
          resourceIds: "[]",
          description: "Konu",
          targetQuestions: 20,
        })),
      ),
  },
  {
    name: "ai_proposals (src/actions/_transcripts-core.ts)",
    paramsPerRow: 9,
    build: (n: number) =>
      db.insert(aiProposals).values(
        rowsOf(n, () => ({
          transcriptId: 1,
          enrollmentId: 1,
          kind: "question_log_upsert" as const,
          payloadJson: "{}",
          sourceQuote: "x",
          confidence: 0.9,
          status: "proposed" as const,
        })),
      ),
  },
];

describe("toplu yazımların D1 parametre bütçesi", () => {
  for (const c of CASES) {
    it(`${c.name}: parça başına ≤ ${D1_MAX_BOUND_PARAMS} parametre`, () => {
      // 500 satırlık gerçekçi bir yük — aksiyondaki bölenle parçalanır.
      const parts = chunkForD1(rowsOf(500, (i) => i), c.paramsPerRow);
      const biggest = parts[0].length;
      const { params } = c.build(biggest).toSQL();
      expect(params.length).toBeLessThanOrEqual(D1_MAX_BOUND_PARAMS);
      // Bölen tam olsun: bir satır daha eklenince sınır aşılmalı.
      const { params: overflow } = c.build(biggest + 1).toSQL();
      expect(overflow.length).toBeGreaterThan(D1_MAX_BOUND_PARAMS);
    });
  }
});
