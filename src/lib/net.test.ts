import { describe, expect, it } from "vitest";
import {
  computeNet,
  rollUpChildren,
  type SubjectCounts,
  type SubjectNode,
} from "./net";

describe("computeNet", () => {
  it("divisor 4 (YKS/KPSS): 30 doğru 8 yanlış → 28", () => {
    expect(computeNet(30, 8, 4)).toBe(28);
  });

  it("divisor 4: quarter steps survive (25 doğru 3 yanlış → 24.25)", () => {
    expect(computeNet(25, 3, 4)).toBe(24.25);
  });

  it("divisor 3 (LGS): 20 doğru 6 yanlış → 18", () => {
    expect(computeNet(20, 6, 3)).toBe(18);
  });

  it("divisor 3: rounds to 2 decimals (10 doğru 1 yanlış → 9.67)", () => {
    expect(computeNet(10, 1, 3)).toBe(9.67);
  });

  it("all blank / untouched: 0 doğru 0 yanlış → 0", () => {
    expect(computeNet(0, 0, 4)).toBe(0);
  });

  it("all wrong can go negative: 0 doğru 8 yanlış divisor 4 → -2", () => {
    expect(computeNet(0, 8, 4)).toBe(-2);
  });

  it("rejects a non-positive divisor", () => {
    expect(() => computeNet(10, 2, 0)).toThrow();
    expect(() => computeNet(10, 2, -4)).toThrow();
  });
});

describe("rollUpChildren", () => {
  // KPSS GY: MAT (scored) with children GEO + MANTIK (not scored); TUR scored.
  const MAT = 1;
  const GEO = 2;
  const MANTIK = 3;
  const TUR = 4;
  const tree: SubjectNode[] = [
    { id: MAT, parentSubjectId: null, isScored: true },
    { id: GEO, parentSubjectId: MAT, isScored: false },
    { id: MANTIK, parentSubjectId: MAT, isScored: false },
    { id: TUR, parentSubjectId: null, isScored: true },
  ];

  it("folds GEO + MANTIK into MAT (own + children)", () => {
    const counts = new Map<number, SubjectCounts>([
      [MAT, { correct: 20, wrong: 4, blank: 6 }],
      [GEO, { correct: 5, wrong: 2, blank: 1 }],
      [MANTIK, { correct: 3, wrong: 1, blank: 0 }],
    ]);
    const rolled = rollUpChildren(counts, tree);
    expect(rolled.get(MAT)).toEqual({ correct: 28, wrong: 7, blank: 7 });
    expect(rolled.size).toBe(1);
  });

  it("keeps scored subjects without children untouched", () => {
    const counts = new Map<number, SubjectCounts>([
      [TUR, { correct: 25, wrong: 5, blank: 0 }],
    ]);
    const rolled = rollUpChildren(counts, tree);
    expect(rolled.get(TUR)).toEqual({ correct: 25, wrong: 5, blank: 0 });
  });

  it("treats a missing blank as 0", () => {
    const counts = new Map<number, SubjectCounts>([
      [MAT, { correct: 10, wrong: 2 }],
      [GEO, { correct: 4, wrong: 0, blank: 2 }],
    ]);
    const rolled = rollUpChildren(counts, tree);
    expect(rolled.get(MAT)).toEqual({ correct: 14, wrong: 2, blank: 2 });
  });

  it("drops counts with no scored ancestor", () => {
    const orphanTree: SubjectNode[] = [
      { id: 9, parentSubjectId: null, isScored: false },
    ];
    const rolled = rollUpChildren(
      new Map([[9, { correct: 5, wrong: 1 }]]),
      orphanTree,
    );
    expect(rolled.size).toBe(0);
  });

  it("net over rolled-up MAT matches the sheet (divisor 4)", () => {
    const counts = new Map<number, SubjectCounts>([
      [MAT, { correct: 20, wrong: 4 }],
      [GEO, { correct: 5, wrong: 2 }],
      [MANTIK, { correct: 3, wrong: 2 }],
    ]);
    const mat = rollUpChildren(counts, tree).get(MAT)!;
    // 28 doğru, 8 yanlış → 28 − 8/4 = 26
    expect(computeNet(mat.correct, mat.wrong, 4)).toBe(26);
  });
});
