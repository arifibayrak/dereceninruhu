import { describe, expect, it } from "vitest";

import { groupMocks, type GroupableMock } from "@/lib/mock-groups";

const mock = (over: Partial<GroupableMock> & { id: number }): GroupableMock => ({
  takenOn: new Date("2026-08-01T00:00:00+03:00"),
  scope: "branch",
  totalNet: 10,
  sectionCode: "KPSS",
  sectionName: "KPSS Denemesi",
  subjectIds: [1],
  subjectNames: ["Matematik"],
  ...over,
});

describe("groupMocks", () => {
  it("branşları derse göre ayırır, genel denemeleri tek grupta toplar", () => {
    const groups = groupMocks([
      mock({ id: 1, subjectIds: [1], subjectNames: ["Matematik"] }),
      mock({ id: 2, subjectIds: [2], subjectNames: ["Türkçe"] }),
      mock({ id: 3, subjectIds: [1], subjectNames: ["Matematik"] }),
      mock({ id: 4, scope: "full", subjectIds: [1, 2], subjectNames: ["A", "B"] }),
    ]);
    expect(groups.map((g) => g.title)).toEqual([
      "KPSS Denemesi",
      "Matematik",
      "Türkçe",
    ]);
    expect(groups[0].kind).toBe("full");
    expect(groups[1].count).toBe(2);
  });

  it("aynı adlı ama farklı bölümün dersini karıştırmaz (ders id'leri ayrı)", () => {
    const groups = groupMocks([
      mock({ id: 1, subjectIds: [7], subjectNames: ["Türkçe"] }),
      mock({
        id: 2,
        sectionCode: "TYT",
        sectionName: "Temel Yeterlilik Testi",
        subjectIds: [21],
        subjectNames: ["Türkçe"],
      }),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.subtitle)).toContain("Temel Yeterlilik Testi");
  });

  it("genel denemeleri bölüm bölüm ayırır (TYT ile AYT aynı ölçek değil)", () => {
    const groups = groupMocks([
      mock({ id: 1, scope: "full", sectionCode: "TYT", sectionName: "TYT" }),
      mock({ id: 2, scope: "full", sectionCode: "AYT", sectionName: "AYT" }),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups.every((g) => g.kind === "full")).toBe(true);
  });

  it("grup istatistikleri: yeniden eskiye sıra, ortalama ve son fark", () => {
    const [group] = groupMocks([
      mock({ id: 1, takenOn: new Date("2026-08-01T00:00:00+03:00"), totalNet: 20 }),
      mock({ id: 2, takenOn: new Date("2026-08-10T00:00:00+03:00"), totalNet: 30 }),
    ]);
    expect(group.mocks.map((m) => m.id)).toEqual([2, 1]);
    expect(group.lastNet).toBe(30);
    expect(group.bestNet).toBe(30);
    expect(group.avgNet).toBe(25);
    expect(group.deltaNet).toBe(10);
  });

  it("tek denemelik grupta fark hesaplanmaz", () => {
    const [group] = groupMocks([mock({ id: 1 })]);
    expect(group.deltaNet).toBeNull();
  });

  it("aynı ders farklı bölüm etiketiyle girilse de tek grupta kalır", () => {
    const groups = groupMocks([
      mock({ id: 1, sectionName: "KPSS Denemesi", sectionCode: "KPSS" }),
      mock({ id: 2, sectionName: "Genel Yetenek", sectionCode: "KPSS_GY" }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].count).toBe(2);
  });

  it("dersi çözülemeyen branş denemesi kaybolmaz", () => {
    const [group] = groupMocks([
      mock({ id: 1, subjectIds: [], subjectNames: [] }),
    ]);
    expect(group.title).toBe("Ders belirtilmemiş");
    expect(group.count).toBe(1);
  });
});
