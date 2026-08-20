import { describe, expect, it } from "vitest";

import {
  formatLessonMinutes,
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
