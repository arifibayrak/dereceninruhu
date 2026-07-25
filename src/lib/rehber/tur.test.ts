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

/** `src/app` altındaki gerçek sayfa rotaları (dinamik segmentler dahil). */
function appRoutes(): string[] {
  const routes: string[] = [];
  const walk = (dir: string, prefix: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) {
        // (grup) klasörleri URL'e yansımaz.
        const seg = name.startsWith("(") ? "" : `/${name}`;
        walk(p, prefix + seg);
      } else if (name === "page.tsx") {
        routes.push(prefix || "/");
      }
    }
  };
  walk("src/app", "");
  return routes;
}

const REAL_ROUTES = appRoutes();

/** Dinamik segmentleri joker sayarak rota eşleştirir. */
function isRealRoute(route: string): boolean {
  const parts = route.split("/").filter(Boolean);
  return REAL_ROUTES.some((r) => {
    const rp = r.split("/").filter(Boolean);
    if (rp.length !== parts.length) return false;
    return rp.every((seg, i) => seg.startsWith("[") || seg === parts[i]);
  });
}

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

/** Kodda gerçekten basılan `data-tour="..."` çapaları. */
const TOUR_ANCHORS = new Set(
  [...appSource().matchAll(/data-tour="([a-z-]+)"/g)].map((m) => m[1]),
);

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

  /**
   * Turun tamamı gerçek ekranlarda yürür. Rotası olmayan adımda gezinme
   * olmaz; kart değişir ama ekran sabit kalır ve tur "takılmış" görünür.
   * Yalnız açılış adımı rotasız olabilir (bulunduğun yerde başlar).
   */
  it("açılış dışındaki her adımın rotası var", () => {
    const missing = tour.steps
      .slice(1)
      .filter((s) => !s.route)
      .map((s) => s.id);
    expect(missing).toEqual([]);
  });

  /**
   * `target`, sayfadaki `data-tour="..."` öğesini gösterir. Kodda böyle bir
   * çapa yoksa ışık sessizce gezinme sekmesine düşer — adım "yanlış yeri
   * gösteriyor" olur ve kimse fark etmez.
   */
  it("her target kodda var olan bir data-tour çapasına karşılık geliyor", () => {
    const unknown = tour.steps
      .filter((s) => s.target && !TOUR_ANCHORS.has(s.target))
      .map((s) => `${s.id} → ${s.target}`);
    expect(unknown).toEqual([]);
  });

  it("her rota gerçekten var olan bir sayfaya karşılık geliyor", () => {
    const unknown = tour.steps
      .filter((s) => s.route && !isRealRoute(s.route))
      .map((s) => `${s.id} → ${s.route}`);
    expect(unknown).toEqual([]);
  });

  it("tur ilerledikçe ekran da değişiyor", () => {
    // Aynı ekranda üst üste 5'ten fazla adım kalırsa tur takılmış hissettirir.
    let run = 0;
    let prev: string | undefined;
    for (const s of tour.steps) {
      if (s.route && s.route === prev) run++;
      else run = 1;
      prev = s.route ?? prev;
      expect(run, `${s.id} — aynı ekranda çok fazla adım`).toBeLessThanOrEqual(
        5,
      );
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
