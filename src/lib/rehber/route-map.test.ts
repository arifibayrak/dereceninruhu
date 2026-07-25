import { describe, expect, it } from "vitest";

import { ogrenciRehberi } from "./ogrenci";
import { kocRehberi } from "./koc";
import { yoneticiRehberi } from "./yonetici";
import { __ENTRIES, resolveRehberHref } from "./route-map";
import { buildIndex, foldTr, matches } from "./search";
import type { Guide } from "./types";

const GUIDES: Record<string, Guide> = {
  ogrenci: ogrenciRehberi,
  koc: kocRehberi,
  yonetici: yoneticiRehberi,
};

describe("route-map", () => {
  it("her eşleme gerçekten var olan bir bölüme işaret eder", () => {
    const missing = __ENTRIES.filter(
      (e) => !GUIDES[e.guide].sections.some((s) => s.id === e.section),
    ).map((e) => `${e.guide}#${e.section}`);
    expect(missing).toEqual([]);
  });

  it("bilinen rotaları doğru rehbere yönlendirir", () => {
    expect(resolveRehberHref("/ogrenci/soru-takibi")).toBe(
      "/ogrenci/rehber#bolum-soru-takibi",
    );
    expect(resolveRehberHref("/koc/ogrenciler/abc123/program")).toBe(
      "/koc/rehber#bolum-program-olustur",
    );
    // Yönetici ekranları yönetici rehberine gider.
    expect(resolveRehberHref("/koc/muhasebe/mutabakat")).toBe(
      "/koc/rehber/yonetici#bolum-mutabakat",
    );
    // Daha özgül desen daha genel olanı yener.
    expect(resolveRehberHref("/koc/muhasebe")).toBe("/koc/rehber#bolum-muhasebe");
  });

  it("eşleşmeyen rotada alanın rehber ana sayfasına düşer", () => {
    expect(resolveRehberHref("/koc/bilinmeyen-ekran")).toBe("/koc/rehber");
    expect(resolveRehberHref("/ogrenci/bilinmeyen")).toBe("/ogrenci/rehber");
  });

  it("rehberin kendi sayfalarında bağlantı üretmez", () => {
    expect(resolveRehberHref("/ogrenci/rehber")).toBeNull();
    expect(resolveRehberHref("/koc/rehber/yonetici")).toBeNull();
  });

  it("uygulama dışı rotalarda bağlantı üretmez", () => {
    expect(resolveRehberHref("/giris")).toBeNull();
    expect(resolveRehberHref("/")).toBeNull();
  });
});

describe("rehber içeriği", () => {
  it.each(Object.entries(GUIDES))("%s: bölüm id'leri benzersiz", (_, guide) => {
    const ids = guide.sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(Object.entries(GUIDES))(
    "%s: her bölümün gövdesi ve özeti dolu",
    (_, guide) => {
      for (const s of guide.sections) {
        expect(s.title.trim(), s.id).not.toBe("");
        expect(s.lead.trim(), s.id).not.toBe("");
        expect(s.blocks.length, s.id).toBeGreaterThan(0);
      }
    },
  );

  it.each(Object.entries(GUIDES))(
    "%s: 'where' rotaları uygulama içi mutlak yol",
    (_, guide) => {
      for (const s of guide.sections) {
        if (s.where) expect(s.where.startsWith("/"), s.id).toBe(true);
      }
    },
  );
});

describe("arama", () => {
  it("Türkçe aksanı ve İ/ı ayrımını yok sayar", () => {
    expect(foldTr("Çalışma Süresi")).toBe("calisma suresi");
    expect(foldTr("IBAN")).toBe("iban");
    expect(foldTr("İçerik")).toBe("icerik");
  });

  it("aksansız yazılan sorgu aksanlı içeriği bulur", () => {
    const index = buildIndex([
      {
        id: "x",
        no: 1,
        chapter: "Test",
        title: "Çalışma süresi",
        lead: "Kronometreyle günlük çalışma.",
        blocks: [{ kind: "para", text: "Başla düğmesine bas." }],
      },
    ]);
    expect(matches(index[0], "calisma")).toBe(true);
    expect(matches(index[0], "basla dugme")).toBe(true);
    expect(matches(index[0], "deneme")).toBe(false);
    expect(matches(index[0], "")).toBe(true);
  });
});
