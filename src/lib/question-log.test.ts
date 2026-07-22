import { describe, expect, it } from "vitest";

import {
  accuracyPct,
  breakdownState,
  entryNet,
  normalizeQuestionEntry,
} from "@/lib/question-log";

describe("breakdownState", () => {
  it("üçü de doluysa full", () => {
    expect(
      breakdownState({ correctCount: 1, wrongCount: 2, blankCount: 3 }),
    ).toBe("full");
  });

  it("sıfırlar da doludur (0 geçerli bir değer)", () => {
    expect(
      breakdownState({ correctCount: 0, wrongCount: 0, blankCount: 0 }),
    ).toBe("full");
  });

  it("üçü de yoksa empty", () => {
    expect(breakdownState({})).toBe("empty");
    expect(
      breakdownState({
        correctCount: null,
        wrongCount: null,
        blankCount: null,
      }),
    ).toBe("empty");
  });

  it("eksik giriş partial", () => {
    expect(breakdownState({ correctCount: 5 })).toBe("partial");
    expect(breakdownState({ correctCount: 5, wrongCount: 1 })).toBe("partial");
  });
});

describe("normalizeQuestionEntry", () => {
  it("D/Y/B'den toplamı türetir", () => {
    expect(
      normalizeQuestionEntry({
        correctCount: 32,
        wrongCount: 6,
        blankCount: 2,
      }),
    ).toEqual({
      questionCount: 40,
      correctCount: 32,
      wrongCount: 6,
      blankCount: 2,
    });
  });

  it("kırılım varsa elle yazılan toplamı yok sayar", () => {
    const out = normalizeQuestionEntry({
      questionCount: 999,
      correctCount: 10,
      wrongCount: 5,
      blankCount: 0,
    });
    expect(out?.questionCount).toBe(15);
  });

  it("yalnız toplam girildiğinde kırılımı null bırakır", () => {
    expect(normalizeQuestionEntry({ questionCount: 120 })).toEqual({
      questionCount: 120,
      correctCount: null,
      wrongCount: null,
      blankCount: null,
    });
  });

  it("toplam verilmezse 0 kabul eder (hücre temizleme)", () => {
    expect(normalizeQuestionEntry({})?.questionCount).toBe(0);
  });

  it("kısmi kırılımı reddeder", () => {
    expect(
      normalizeQuestionEntry({ correctCount: 10, wrongCount: 2 }),
    ).toBeNull();
  });

  it("negatif değerleri reddeder", () => {
    expect(
      normalizeQuestionEntry({
        correctCount: -1,
        wrongCount: 0,
        blankCount: 0,
      }),
    ).toBeNull();
    expect(normalizeQuestionEntry({ questionCount: -5 })).toBeNull();
  });

  it("üst sınırı aşan toplamı reddeder", () => {
    expect(normalizeQuestionEntry({ questionCount: 2001 })).toBeNull();
    expect(
      normalizeQuestionEntry({
        correctCount: 1500,
        wrongCount: 400,
        blankCount: 200,
      }),
    ).toBeNull();
  });
});

describe("entryNet", () => {
  it("YKS bölenle (4) net hesaplar", () => {
    expect(entryNet({ correctCount: 32, wrongCount: 6 }, 4)).toBe(30.5);
  });

  it("LGS bölenle (3) net hesaplar", () => {
    expect(entryNet({ correctCount: 10, wrongCount: 3 }, 3)).toBe(9);
  });

  it("kırılım yoksa null", () => {
    expect(entryNet({ correctCount: null, wrongCount: null }, 4)).toBeNull();
  });
});

describe("accuracyPct", () => {
  it("boşları paydaya katmaz", () => {
    expect(accuracyPct(32, 8)).toBe(80);
  });

  it("hiç işaretlenmemişse null", () => {
    expect(accuracyPct(0, 0)).toBeNull();
  });
});
