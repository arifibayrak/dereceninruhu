import { describe, expect, it } from "vitest";
import { slugifyTr } from "./slug";

describe("slugifyTr", () => {
  it("maps Turkish characters", () => {
    expect(slugifyTr("Deneme Analizi Nasıl Yapılır?")).toBe(
      "deneme-analizi-nasil-yapilir",
    );
    expect(slugifyTr("Çalışma Programı: Öğrenci Şablonu")).toBe(
      "calisma-programi-ogrenci-sablonu",
    );
  });

  it("handles dotted/dotless I both ways", () => {
    expect(slugifyTr("Isparta İstanbul")).toBe("isparta-istanbul");
  });

  it("collapses punctuation and trims dashes", () => {
    expect(slugifyTr("  --YKS'de %10'luk dilim!!  ")).toBe("yks-de-10-luk-dilim");
  });

  it("returns empty string for empty-ish input", () => {
    expect(slugifyTr("???")).toBe("");
  });
});
