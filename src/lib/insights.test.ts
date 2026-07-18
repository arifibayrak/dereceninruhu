import { describe, expect, it } from "vitest";
import { addDays, trDayKey } from "@/lib/dates";
import { buildStudentInsights, computeStreak, netTrend } from "@/lib/insights";

const NOW = new Date("2026-07-18T09:00:00+03:00");

describe("computeStreak", () => {
  it("counts consecutive days ending today", () => {
    const keys = [0, 1, 2].map((n) => trDayKey(addDays(NOW, -n)));
    expect(computeStreak(keys, NOW)).toBe(3);
  });
  it("anchors to yesterday when today is empty", () => {
    const keys = [1, 2].map((n) => trDayKey(addDays(NOW, -n)));
    expect(computeStreak(keys, NOW)).toBe(2);
  });
  it("breaks on a gap", () => {
    const keys = [0, 1, 3].map((n) => trDayKey(addDays(NOW, -n)));
    expect(computeStreak(keys, NOW)).toBe(2);
  });
  it("is 0 with no recent activity", () => {
    const keys = [5, 6].map((n) => trDayKey(addDays(NOW, -n)));
    expect(computeStreak(keys, NOW)).toBe(0);
    expect(computeStreak([], NOW)).toBe(0);
  });
});

describe("netTrend", () => {
  it("returns nulls for empty", () => {
    expect(netTrend([]).direction).toBeNull();
  });
  it("computes delta and direction", () => {
    const t = netTrend([
      { takenOn: new Date("2026-06-01"), net: 60 },
      { takenOn: new Date("2026-06-15"), net: 68 },
    ]);
    expect(t.latest).toBe(68);
    expect(t.delta).toBe(8);
    expect(t.direction).toBe("up");
  });
});

describe("buildStudentInsights", () => {
  it("surfaces staleness and a rising net", () => {
    const insights = buildStudentInsights({
      activeDayKeys: [],
      lastActivity: addDays(NOW, -4),
      weekQuestionTotal: 120,
      lastWeekQuestionTotal: 60,
      netSeries: [
        { takenOn: new Date("2026-06-01"), net: 62 },
        { takenOn: new Date("2026-06-20"), net: 70.5 },
      ],
      now: NOW,
    });
    const ids = insights.map((i) => i.id);
    expect(ids).toContain("stale");
    expect(ids).toContain("net-up");
    expect(ids).toContain("volume-up");
  });
});
