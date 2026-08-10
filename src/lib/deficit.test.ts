import { describe, expect, it } from "vitest";
import type { TopicDeficit } from "@/db/queries/analiz";
import { groupDeficitsBySubject } from "@/lib/deficit";

function konu(
  topicId: number,
  topicName: string,
  subject: { id: number; name: string; color?: string | null },
  total: number,
): TopicDeficit {
  return {
    topicId,
    topicName,
    subjectId: subject.id,
    subjectName: subject.name,
    chartColor: subject.color ?? null,
    total,
  };
}

const TUR = { id: 1, name: "Türkçe", color: "#E11D48" };
const MAT = { id: 2, name: "Matematik", color: "#2563EB" };
/** Alt ders — sorgu rengi üst dersten (Matematik) devralarak getirir. */
const GEO = { id: 3, name: "Geometri", color: "#2563EB" };
const COG = { id: 4, name: "Coğrafya", color: "#059669" };

describe("groupDeficitsBySubject", () => {
  it("boş girdide boş döner", () => {
    expect(groupDeficitsBySubject([])).toEqual([]);
  });

  it("dersleri toplam eksiğe göre sıralar", () => {
    const groups = groupDeficitsBySubject([
      konu(10, "Paragrafta Anlam", TUR, 42),
      konu(11, "Güncel", COG, 20),
      konu(12, "Sözel Muhakeme", TUR, 15),
      konu(13, "Nüfus", COG, 4),
    ]);
    expect(groups.map((g) => [g.subjectName, g.total])).toEqual([
      ["Türkçe", 57],
      ["Coğrafya", 24],
    ]);
  });

  it("her dersten yalnız ilk N konuyu tutar ama toplamı tam sayar", () => {
    const groups = groupDeficitsBySubject(
      [9, 8, 7, 6, 5, 4, 3].map((n, i) => konu(100 + i, `Konu ${i}`, TUR, n)),
      5,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].topics.map((t) => t.total)).toEqual([9, 8, 7, 6, 5]);
    // total ve topicCount gösterilen 5 ile sınırlı değil.
    expect(groups[0].total).toBe(42);
    expect(groups[0].topicCount).toBe(7);
  });

  it("girdinin sırasına güvenmez, konuları kendi içinde çoktan aza dizer", () => {
    const groups = groupDeficitsBySubject([
      konu(20, "Az", TUR, 2),
      konu(21, "Çok", TUR, 9),
      konu(22, "Orta", TUR, 5),
    ]);
    expect(groups[0].topics.map((t) => t.topicName)).toEqual([
      "Çok",
      "Orta",
      "Az",
    ]);
  });

  it("alt dersi üst derse KATLAMAZ — Geometri kendi grubu olarak kalır", () => {
    const groups = groupDeficitsBySubject([
      konu(30, "Katı cisimler", GEO, 9),
      konu(31, "Olasılık", MAT, 5),
      konu(32, "Çemberde açı", GEO, 6),
    ]);
    expect(groups.map((g) => [g.subjectName, g.total])).toEqual([
      ["Geometri", 15],
      ["Matematik", 5],
    ]);
    // Renk sorguda üst dersten devralınır; grup onu olduğu gibi taşır.
    expect(groups[0].chartColor).toBe("#2563EB");
  });

  it("eşit toplamda Türkçe alfabetik sıralar", () => {
    const groups = groupDeficitsBySubject([
      konu(40, "Nüfus", COG, 6),
      konu(41, "Paragraf", TUR, 6),
      konu(42, "İşlem", { id: 5, name: "İşlem Yeteneği" }, 6),
    ]);
    expect(groups.map((g) => g.subjectName)).toEqual([
      "Coğrafya",
      "İşlem Yeteneği",
      "Türkçe",
    ]);
  });
});
