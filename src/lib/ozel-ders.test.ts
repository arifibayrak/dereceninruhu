import { describe, expect, it } from "vitest";

import {
  accruedHours,
  formatLessonMinutes,
  periodsElapsed,
  mergeQuota,
  quotaSummary,
  type QuotaLesson,
} from "@/lib/ozel-ders";

const lesson = (p: Partial<QuotaLesson>): QuotaLesson => ({
  status: "held",
  durationMinutes: 60,
  countsAgainstQuota: true,
  ...p,
});

describe("quotaSummary", () => {
  it("yalnız işlenmiş dersler kotayı yakar", () => {
    const s = quotaSummary(4, [
      lesson({ status: "held" }),
      lesson({ status: "held", durationMinutes: 90 }),
      lesson({ status: "scheduled" }),
      lesson({ status: "cancelled" }),
      lesson({ status: "missed" }),
    ]);
    expect(s.grantedMinutes).toBe(240);
    expect(s.usedMinutes).toBe(150);
    expect(s.scheduledMinutes).toBe(60);
    expect(s.remainingMinutes).toBe(90);
    expect(s.overusedMinutes).toBe(0);
  });

  it("haktan muaf ders (telafi) sayacı etkilemez", () => {
    const s = quotaSummary(2, [
      lesson({ countsAgainstQuota: false, durationMinutes: 120 }),
    ]);
    expect(s.usedMinutes).toBe(0);
    expect(s.remainingMinutes).toBe(120);
  });

  it("aşım kalanı negatife düşürmez, ayrı raporlanır", () => {
    const s = quotaSummary(1, [lesson({ durationMinutes: 150 })]);
    expect(s.remainingMinutes).toBe(0);
    expect(s.overusedMinutes).toBe(90);
  });

  it("hak tanınmamışsa her işlenen ders aşımdır", () => {
    const s = quotaSummary(0, [lesson({})]);
    expect(s.grantedMinutes).toBe(0);
    expect(s.overusedMinutes).toBe(60);
  });
});

describe("mergeQuota", () => {
  it("birden çok paketin hakkını toplar", () => {
    const a = quotaSummary(2, [lesson({ durationMinutes: 60 })]);
    const b = quotaSummary(3, [lesson({ status: "scheduled" })]);
    const m = mergeQuota([a, b]);
    expect(m.grantedMinutes).toBe(300);
    expect(m.usedMinutes).toBe(60);
    expect(m.scheduledMinutes).toBe(60);
    expect(m.remainingMinutes).toBe(60 + 180);
  });
});

describe("formatLessonMinutes", () => {
  it("saat ve dakikayı Türkçe yazar", () => {
    expect(formatLessonMinutes(0)).toBe("0 dk");
    expect(formatLessonMinutes(45)).toBe("45 dk");
    expect(formatLessonMinutes(60)).toBe("1 sa");
    expect(formatLessonMinutes(150)).toBe("2 sa 30 dk");
  });
});

describe("periodsElapsed", () => {
  const d = (s: string) => new Date(`${s}T00:00:00+03:00`);

  it("başlangıç günü 1. dönemdir", () => {
    expect(periodsElapsed(d("2026-08-24"), d("2026-08-24"), "haftalik")).toBe(1);
    expect(periodsElapsed(d("2026-08-24"), d("2026-08-24"), "aylik")).toBe(1);
  });

  it("haftalık: 7 günde bir yeni dönem", () => {
    const s = d("2026-08-24");
    expect(periodsElapsed(s, d("2026-08-30"), "haftalik")).toBe(1);
    expect(periodsElapsed(s, d("2026-08-31"), "haftalik")).toBe(2);
    expect(periodsElapsed(s, d("2026-10-12"), "haftalik")).toBe(8);
  });

  it("aylık: ayın günü gelmeden yeni dönem başlamaz", () => {
    const s = d("2026-08-15");
    expect(periodsElapsed(s, d("2026-09-14"), "aylik")).toBe(1);
    expect(periodsElapsed(s, d("2026-09-15"), "aylik")).toBe(2);
    expect(periodsElapsed(s, d("2027-02-15"), "aylik")).toBe(7);
  });

  it("ay başında saat dilimi kayması dönem sayısını bozmaz", () => {
    // TRT gece yarısı = UTC'de bir önceki günün 21:00'i; ham getMonth() burada
    // bir eksik ay verirdi.
    expect(periodsElapsed(d("2026-08-01"), d("2026-09-01"), "aylik")).toBe(2);
  });

  it("endsOn geçmişse birikim orada durur", () => {
    const s = d("2026-08-24");
    expect(
      periodsElapsed(s, d("2026-12-01"), "haftalik", d("2026-09-14")),
    ).toBe(4);
  });

  it("başlangıç yoksa dönem sayılmaz", () => {
    expect(periodsElapsed(null, d("2026-09-01"), "haftalik")).toBe(0);
  });
});

describe("accruedHours", () => {
  const d = (s: string) => new Date(`${s}T00:00:00+03:00`);
  const base = { lessonHoursGranted: 0, hoursPerPeriod: 0, startsOn: null, endsOn: null };

  it("yenilenmeyen pakette sabit toplam", () => {
    expect(
      accruedHours({ ...base, renewal: "yok", lessonHoursGranted: 40 }, d("2027-01-01")),
    ).toBe(40);
  });

  it("haftada 1 saat 8 haftada 8 saate çıkar", () => {
    expect(
      accruedHours(
        { ...base, renewal: "haftalik", hoursPerPeriod: 1, startsOn: d("2026-08-24") },
        d("2026-10-12"),
      ),
    ).toBe(8);
  });

  it("ayda 4 saat üçüncü ayda 12 saate çıkar", () => {
    expect(
      accruedHours(
        { ...base, renewal: "aylik", hoursPerPeriod: 4, startsOn: d("2026-08-15") },
        d("2026-10-15"),
      ),
    ).toBe(12);
  });
});
