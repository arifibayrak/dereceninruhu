import { describe, expect, it } from "vitest";

import { combinedMockLabel, examLabels, examScopesOf } from "@/lib/exam";

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
