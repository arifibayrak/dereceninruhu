import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { AKISLAR } from "./akis";
import { ogrenciRehberi } from "./ogrenci";
import { kocRehberi } from "./koc";
import { yoneticiRehberi } from "./yonetici";

const ALL_STEPS = AKISLAR.flatMap((f) => f.steps);

/** Rehber verisi dışındaki tüm kaynak — buton etiketlerini burada ararız. */
function appSource(): string {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n);
      if (p.includes("/lib/rehber")) continue;
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.tsx?$/.test(p)) files.push(p);
    }
  };
  walk("src");
  return files
    .map((f) => readFileSync(f, "utf8"))
    .join("\n")
    .replace(/\s+/g, " ");
}

describe("akış verisi", () => {
  it("akış ve adım id'leri benzersiz", () => {
    const flowIds = AKISLAR.map((f) => f.id);
    expect(new Set(flowIds).size).toBe(flowIds.length);
    const stepIds = ALL_STEPS.map((s) => s.id);
    expect(new Set(stepIds).size).toBe(stepIds.length);
  });

  it("her adımın özeti ve sonucu dolu", () => {
    for (const s of ALL_STEPS) {
      expect(s.summary.trim(), s.id).not.toBe("");
      expect(s.outcome.trim(), s.id).not.toBe("");
    }
  });

  it("'where' değerleri uygulama içi mutlak yol", () => {
    for (const s of ALL_STEPS) {
      if (s.where) expect(s.where.startsWith("/"), s.id).toBe(true);
    }
  });

  // "Rehberde oku" bağlantısı kırık olmasın: her section gerçekten var olmalı.
  it("her adımın rehber bölümü gerçekten var", () => {
    const known = new Set(
      [ogrenciRehberi, kocRehberi, yoneticiRehberi].flatMap((g) =>
        g.sections.map((s) => s.id),
      ),
    );
    const missing = ALL_STEPS.filter(
      (s) => s.section && !known.has(s.section),
    ).map((s) => `${s.id} → ${s.section}`);
    expect(missing).toEqual([]);
  });

  // Akıştaki buton etiketleri de uygulamadaki gerçek dizeler olmalı.
  it("buton etiketleri kodda geçiyor", () => {
    const hay = appSource();
    // JSX varlıkları ve şablon değişkenleri statik aramada görünmez.
    const EXEMPT = new Set(["Lead durumu"]);
    const missing: string[] = [];
    for (const s of ALL_STEPS) {
      for (const b of s.buttons ?? []) {
        if (EXEMPT.has(b.label)) continue;
        if (!hay.includes(b.label)) missing.push(`${s.id}: ${b.label}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("devir noktaları işaretli — akışın kilit adımları kaybolmasın", () => {
    const gates = ALL_STEPS.filter((s) => s.gate).map((s) => s.id);
    // Yayınla, Cal linki, davet, analiz ve ödeme onayı akışın kilit kapıları.
    expect(gates).toContain("yayinla");
    expect(gates).toContain("cal");
    expect(gates).toContain("bildirim");
  });
});
