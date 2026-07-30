import { describe, expect, it } from "vitest";

import {
  combinedMockLabel,
  durationPresets,
  examLabels,
  examScopesOf,
  officialDurationMinutes,
} from "@/lib/exam";

describe("examScopesOf", () => {
  it("tek sınavlı kayıtta tek kapsam döner", () => {
    expect(examScopesOf({ examTemplateId: 1, trackCode: "SAY" })).toEqual([
      { examTemplateId: 1, trackCode: "SAY" },
    ]);
  });

  it("ikinci sınav varsa birincil önce, ikincil sonra", () => {
    expect(
      examScopesOf({
        examTemplateId: 2,
        trackCode: "EA",
        secondaryExamTemplateId: 3,
        secondaryTrackCode: null,
      }),
    ).toEqual([
      { examTemplateId: 2, trackCode: "EA" },
      { examTemplateId: 3, trackCode: null },
    ]);
  });

  it("ikinci sınavın alanı taşınır (YKS ikinci sınav)", () => {
    const scopes = examScopesOf({
      examTemplateId: 1,
      trackCode: null,
      secondaryExamTemplateId: 2,
      secondaryTrackCode: "SOZ",
    });
    expect(scopes[1]).toEqual({ examTemplateId: 2, trackCode: "SOZ" });
  });

  it("aynı şablon iki kez verilirse tekilleştirir", () => {
    expect(
      examScopesOf({
        examTemplateId: 4,
        trackCode: null,
        secondaryExamTemplateId: 4,
        secondaryTrackCode: null,
      }),
    ).toHaveLength(1);
  });

  it("null/undefined ikinci sınav yok sayılır", () => {
    expect(
      examScopesOf({
        examTemplateId: 1,
        trackCode: null,
        secondaryExamTemplateId: null,
      }),
    ).toHaveLength(1);
    expect(examScopesOf({ examTemplateId: 1, trackCode: null })).toHaveLength(1);
  });
});

describe("examLabels", () => {
  it("alanı olan tek sınav", () => {
    expect(examLabels({ examCode: "YKS", trackName: "Sayısal" })).toEqual([
      "YKS · Sayısal",
    ]);
  });

  it("alansız tek sınav", () => {
    expect(examLabels({ examCode: "KPSS", trackName: null })).toEqual(["KPSS"]);
  });

  it("çift sınav — ikisi de rozetlenir", () => {
    expect(
      examLabels({
        examCode: "KPSS",
        trackName: null,
        secondaryExamCode: "YKS",
        secondaryTrackName: "Eşit Ağırlık",
      }),
    ).toEqual(["KPSS", "YKS · Eşit Ağırlık"]);
  });
});

describe("combinedMockLabel", () => {
  it("KPSS tek oturumdur — birleşik giriş adı döner", () => {
    expect(combinedMockLabel("KPSS")).toBe("KPSS Denemesi");
  });

  it("YKS'de TYT ve AYT ayrı oturumlardır — birleşmez", () => {
    expect(combinedMockLabel("YKS")).toBeNull();
    expect(combinedMockLabel("LGS")).toBeNull();
  });
});

describe("officialDurationMinutes", () => {
  it("bölümün resmî süresini verir", () => {
    expect(officialDurationMinutes(["TYT"])).toBe(165);
    expect(officialDurationMinutes(["AYT"])).toBe(180);
  });

  it("birleşik oturumda bölümleri toplar (KPSS GY+GK = 130)", () => {
    expect(officialDurationMinutes(["KPSS_GY", "KPSS_GK"])).toBe(130);
  });

  it("tanınmayan bölümde null", () => {
    expect(officialDurationMinutes(["BILINMEYEN"])).toBeNull();
    expect(officialDurationMinutes([])).toBeNull();
  });
});

describe("durationPresets", () => {
  it("branşta kısa sabit süreler döner", () => {
    const p = durationPresets({ scope: "branch", sectionCodes: ["TYT"] });
    expect(p.map((x) => x.minutes)).toEqual([15, 20, 30, 40, 60]);
  });

  it("tam denemede resmî süre başta ve etiketli", () => {
    const p = durationPresets({ scope: "full", sectionCodes: ["TYT"] });
    expect(p[0]).toEqual({ minutes: 165, label: "165 dk · Resmî" });
    expect(p.map((x) => x.minutes)).toEqual([165, 150, 135, 120]);
  });

  it("bölüm tanınmıyorsa makul aralığa düşer", () => {
    const p = durationPresets({ scope: "full", sectionCodes: ["BILINMEYEN"] });
    expect(p.map((x) => x.minutes)).toEqual([60, 90, 120, 150, 180]);
  });

  it("kısa resmî sürede negatif seçenek üretmez", () => {
    const p = durationPresets({ scope: "full", sectionCodes: ["KPSS_GY"] });
    expect(p.every((x) => x.minutes > 0)).toBe(true);
  });
});
