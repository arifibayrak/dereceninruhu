import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { kocTuru } from "./tur-koc";
import { ogrenciTuru } from "./tur-ogrenci";
import { yoneticiTuru } from "./tur-yonetici";
import { ogrenciRehberi } from "./ogrenci";
import { kocRehberi } from "./koc";
import { yoneticiRehberi } from "./yonetici";
import type { Tour } from "./tur-types";

const TOURS: [string, Tour][] = [
  ["ogrenci", ogrenciTuru],
  ["koc", kocTuru],
  ["yonetici", yoneticiTuru],
];

/** Turun bölüm bağlantıları hangi rehbere gitmeli. */
const GUIDE_FOR_TOUR: Record<string, { sections: { id: string }[] }> = {
  ogrenci: ogrenciRehberi,
  koc: kocRehberi,
  yonetici: yoneticiRehberi,
};

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

describe.each(TOURS)("tur: %s", (name, tour) => {
  it("adım id'leri benzersiz", () => {
    const ids = tour.steps.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("her adımın başlığı, amacı ve öne çıkanları dolu", () => {
    for (const s of tour.steps) {
      expect(s.title.trim(), s.id).not.toBe("");
      expect(s.purpose.trim(), s.id).not.toBe("");
      expect(s.nav.trim(), s.id).not.toBe("");
      expect(s.highlights.length, s.id).toBeGreaterThan(0);
    }
  });

  it("route değerleri uygulama içi mutlak yol", () => {
    for (const s of tour.steps) {
      if (s.route) expect(s.route.startsWith("/"), s.id).toBe(true);
    }
  });

  // "Rehberde ayrıntısı" bağlantısı kırık olmasın.
  it("her adımın rehber bölümü gerçekten var", () => {
    const known = new Set(GUIDE_FOR_TOUR[name].sections.map((s) => s.id));
    const missing = tour.steps
      .filter((s) => s.section && !known.has(s.section))
      .map((s) => `${s.id} → ${s.section}`);
    expect(missing).toEqual([]);
  });

  it("buton etiketleri kodda geçiyor", () => {
    const hay = appSource();
    const missing: string[] = [];
    for (const s of tour.steps) {
      for (const b of s.buttons ?? []) {
        // Dinamik sayı içeren etiketler statik aramada bulunmaz.
        if (/\b[NX]\b|\{n\}|…/.test(b.label)) continue;
        if (!hay.includes(b.label)) missing.push(`${s.id}: ${b.label}`);
      }
    }
    expect(missing).toEqual([]);
  });
});

describe("tur kapsamı", () => {
  it("koç turu yönetici ekranlarını anlatmaz", () => {
    const adminRoutes = [
      "/koc/yonetim",
      "/koc/site",
      "/koc/ice-aktar",
      "/koc/basvurular",
      "/koc/muhasebe/mutabakat",
    ];
    const leaks = kocTuru.steps
      .filter((s) => s.route && adminRoutes.some((r) => s.route === r))
      .map((s) => `${s.id} → ${s.route}`);
    expect(leaks).toEqual([]);
  });

  it("her tur gezinmenin ana duraklarını kapsıyor", () => {
    const kocNavs = kocTuru.steps.map((s) => s.nav);
    for (const n of ["Panel", "Öğrenciler", "Denemeler", "Muhasebe"]) {
      expect(kocNavs, n).toContain(n);
    }
    const ogrNavs = ogrenciTuru.steps.map((s) => s.nav);
    for (const n of ["Bugün", "Program", "Sorular", "Denemeler"]) {
      expect(ogrNavs, n).toContain(n);
    }
  });
});
