/**
 * Net hesaplama ve ders roll-up yardımcıları. Framework-free — pure functions
 * shared by Server Actions, the migration importer, and tests.
 *
 * Net = doğru − yanlış / divisor. The divisor comes from
 * `exam_sections.wrong_penalty_divisor` (3 for LGS, 4 for YKS/KPSS).
 * The result is stored as a REAL snapshot at write time.
 */

/**
 * Compute the net for a subject/section.
 * Rounded to 2 decimals (Turkish nets move in .25 / .33 steps).
 */
export function computeNet(
  correct: number,
  wrong: number,
  divisor: number,
): number {
  if (!Number.isFinite(divisor) || divisor <= 0) {
    throw new Error(`Geçersiz divisor: ${divisor} (pozitif olmalı)`);
  }
  const net = correct - wrong / divisor;
  return Math.round(net * 100) / 100;
}

/** Minimal view of a subject row needed for roll-up. */
export interface SubjectNode {
  id: number;
  parentSubjectId: number | null;
  isScored: boolean;
}

/** D/Y/B counts for one subject. `blank` is optional (soru-takibi has none). */
export interface SubjectCounts {
  correct: number;
  wrong: number;
  blank?: number;
}

/**
 * Aggregate per-subject counts up the subject tree so that every count lands
 * on its nearest SCORED ancestor (GEO + MANTIK fold into MAT; a scored
 * subject keeps its own counts plus all descendants').
 *
 * Counts logged against a subject with no scored self-or-ancestor are
 * dropped — they cannot appear in mock results / net charts.
 *
 * Returns a new Map keyed by scored subject id. Input is not mutated.
 */
export function rollUpChildren(
  counts: ReadonlyMap<number, SubjectCounts>,
  subjectTree: readonly SubjectNode[],
): Map<number, SubjectCounts> {
  const byId = new Map<number, SubjectNode>(
    subjectTree.map((s) => [s.id, s]),
  );

  /** Walk up parent links to the nearest scored subject (self included). */
  const scoredTargetOf = (subjectId: number): number | null => {
    let current = byId.get(subjectId);
    const seen = new Set<number>();
    while (current) {
      if (seen.has(current.id)) return null; // cycle guard
      seen.add(current.id);
      if (current.isScored) return current.id;
      current =
        current.parentSubjectId === null
          ? undefined
          : byId.get(current.parentSubjectId);
    }
    return null;
  };

  const result = new Map<number, SubjectCounts>();
  for (const [subjectId, c] of counts) {
    const targetId = scoredTargetOf(subjectId);
    if (targetId === null) continue;
    const acc = result.get(targetId) ?? { correct: 0, wrong: 0, blank: 0 };
    result.set(targetId, {
      correct: acc.correct + c.correct,
      wrong: acc.wrong + c.wrong,
      blank: (acc.blank ?? 0) + (c.blank ?? 0),
    });
  }
  return result;
}
