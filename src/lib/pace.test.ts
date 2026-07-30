import { describe, expect, it } from "vitest";

import {
  buildPaceViews,
  formatPace,
  formatPaceDeltaShort,
  paceKey,
  secondsPerQuestion,
} from "./pace";

describe("secondsPerQuestion", () => {
  it("süre ve soru varsa soru başına saniye döner", () => {
    // 40 soru 35 dk = 2100 sn → 52,5 sn/soru
    expect(secondsPerQuestion(35, 40)).toBeCloseTo(52.5);
  });

  it("süre girilmemişse null (tempo uydurulmaz)", () => {
    expect(secondsPerQuestion(null, 40)).toBeNull();
    expect(secondsPerQuestion(undefined, 40)).toBeNull();
    expect(secondsPerQuestion(0, 40)).toBeNull();
    expect(secondsPerQuestion(NaN, 40)).toBeNull();
  });

  it("soru sayısı yoksa null (sıfıra bölme yok)", () => {
    expect(secondsPerQuestion(35, 0)).toBeNull();
  });
});

describe("formatPace", () => {
  it("tam sayıya yuvarlar", () => {
    expect(formatPace(52.5)).toBe("53 sn/soru");
    expect(formatPace(52.4)).toBe("52 sn/soru");
  });
});

describe("formatPaceDeltaShort", () => {
  it("hızlanmayı eksi, yavaşlamayı artı gösterir", () => {
    expect(formatPaceDeltaShort(-6.2)).toBe("−6 sn");
    expect(formatPaceDeltaShort(4)).toBe("+4 sn");
    expect(formatPaceDeltaShort(0.2)).toBe("0 sn");
  });
});

describe("paceKey", () => {
  it("ders sırasından bağımsız aynı anahtarı üretir", () => {
    expect(paceKey([3, 1, 2])).toBe(paceKey([1, 2, 3]));
  });
});

describe("buildPaceViews", () => {
  const mock = (
    id: number,
    durationMinutes: number | null,
    questionCount: number,
    subjectIds: number[],
  ) => ({ id, durationMinutes, questionCount, subjectIds });

  it("aynı dersin bir önceki denemesiyle kıyaslar", () => {
    // Yeniden eskiye: 40 soru 30 dk (45 sn) ← 40 soru 40 dk (60 sn)
    const views = buildPaceViews([
      mock(2, 30, 40, [7]),
      mock(1, 40, 40, [7]),
    ]);
    expect(views.get(1)?.delta).toBeNull(); // ilk kayıt — kıyas yok
    expect(views.get(2)?.delta).toBeCloseTo(-15);
    expect(views.get(2)?.faster).toBe(true);
    expect(views.get(2)?.deltaLabel).toBe("−15 sn");
  });

  it("farklı dersin denemesini kıyasa katmaz", () => {
    const views = buildPaceViews([
      mock(2, 30, 40, [9]), // Matematik
      mock(1, 40, 40, [7]), // Türkçe
    ]);
    expect(views.get(2)?.delta).toBeNull();
  });

  it("süresi olmayan denemeyi tamamen atlar", () => {
    const views = buildPaceViews([
      mock(2, 30, 40, [7]),
      mock(1, null, 40, [7]),
    ]);
    expect(views.has(1)).toBe(false);
    expect(views.get(2)?.delta).toBeNull();
  });

  it("yavaşlamayı işaretler", () => {
    const views = buildPaceViews([
      mock(2, 50, 40, [7]),
      mock(1, 40, 40, [7]),
    ]);
    expect(views.get(2)?.faster).toBe(false);
    expect(views.get(2)?.deltaLabel).toBe("+15 sn");
  });

  it("fark yoksa yön belirtmez", () => {
    const views = buildPaceViews([
      mock(2, 40, 40, [7]),
      mock(1, 40, 40, [7]),
    ]);
    expect(views.get(2)?.faster).toBeNull();
    expect(views.get(2)?.deltaLabel).toBe("0 sn");
  });
});
