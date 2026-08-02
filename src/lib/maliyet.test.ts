import { describe, expect, it } from "vitest";

import {
  kullanimUsd,
  projeksiyon,
  SABIT_GIDERLER,
  usdToKurus,
  USD_TRY,
  type GiderKalemi,
} from "@/lib/maliyet";

const bos = { cachedInputTokens: 0, audioSeconds: null };

describe("kullanimUsd", () => {
  it("Haiku 4.5'i ilan fiyatından hesaplar", () => {
    // 1M girdi × $1 + 1M çıktı × $5 = $6
    expect(
      kullanimUsd({
        model: "anthropic/claude-haiku-4.5",
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
        ...bos,
      }),
    ).toBeCloseTo(6, 6);
  });

  it("önbellekten okunan girdiyi onda bir fiyatlar", () => {
    expect(
      kullanimUsd({
        model: "anthropic/claude-haiku-4.5",
        inputTokens: 0,
        outputTokens: 0,
        cachedInputTokens: 1_000_000,
        audioSeconds: null,
      }),
    ).toBeCloseTo(0.1, 6);
  });

  it("bilinmeyen modelde varsayılan fiyata düşer, patlamaz", () => {
    const usd = kullanimUsd({
      model: "acayip/yeni-model",
      inputTokens: 1_000_000,
      outputTokens: 0,
      ...bos,
    });
    expect(usd).toBeCloseTo(1, 6);
  });

  it("ses kaydını süreden hesaplar, jetonu yok sayar", () => {
    // 60 sn = 1 dk × $0,0015
    expect(
      kullanimUsd({
        model: "openai/whisper-large-v3-turbo",
        inputTokens: 999_999,
        outputTokens: 999_999,
        cachedInputTokens: 0,
        audioSeconds: 60,
      }),
    ).toBeCloseTo(0.0015, 8);
  });

  it("sıfır kullanım sıfır maliyet", () => {
    expect(
      kullanimUsd({
        model: "anthropic/claude-haiku-4.5",
        inputTokens: 0,
        outputTokens: 0,
        ...bos,
      }),
    ).toBe(0);
  });
});

describe("usdToKurus", () => {
  it("kuru uygulayıp tamsayı kuruşa yuvarlar", () => {
    expect(usdToKurus(1)).toBe(Math.round(USD_TRY * 100));
    expect(Number.isInteger(usdToKurus(3.337))).toBe(true);
  });
});

describe("projeksiyon", () => {
  const sabit: GiderKalemi[] = [
    { ad: "test", aylikUsd: 10, aciklama: "", degisken: false },
  ];

  it("sabit gider + öğrenci başına AI", () => {
    const p = projeksiyon(100, 0.08, 0, sabit);
    expect(p.aylikUsd).toBeCloseTo(10 + 8, 6);
    expect(p.ogrenciBasinaUsd).toBeCloseTo(0.18, 6);
  });

  it("öğrenci arttıkça öğrenci başına maliyet düşer", () => {
    const az = projeksiyon(50, 0.08, 0, sabit);
    const cok = projeksiyon(500, 0.08, 0, sabit);
    expect(cok.ogrenciBasinaUsd).toBeLessThan(az.ogrenciBasinaUsd);
  });

  it("R2 ücretsiz kotası aşılmadan depolama ücreti yazmaz", () => {
    // 100 öğrenci × 0,01 GB = 1 GB < 10 GB ücretsiz
    const p = projeksiyon(100, 0, 0.01, sabit);
    expect(p.aylikUsd).toBeCloseTo(10, 6);
  });

  it("R2 kotası aşılınca yalnız aşan kısmı ücretlendirir", () => {
    // 1000 öğrenci × 0,05 GB = 50 GB → 40 GB aşım × $0,015
    const p = projeksiyon(1000, 0, 0.05, sabit);
    expect(p.aylikUsd).toBeCloseTo(10 + 40 * 0.015, 6);
  });

  it("sıfır öğrencide sabit gideri öğrenci başına diye bölmeye çalışmaz", () => {
    const p = projeksiyon(0, 0.08, 0, sabit);
    expect(p.aylikUsd).toBeCloseTo(10, 6);
    expect(Number.isFinite(p.ogrenciBasinaUsd)).toBe(true);
  });
});

describe("SABIT_GIDERLER", () => {
  it("yıllık ödenen alan adı aylığa bölünmüş", () => {
    const alan = SABIT_GIDERLER.find((g) => g.ad.includes("Alan adı"));
    expect(alan?.aylikUsd).toBeCloseTo(10.44 / 12, 6);
  });

  it("hepsi pozitif ve tanımlı", () => {
    for (const g of SABIT_GIDERLER) {
      expect(g.aylikUsd).toBeGreaterThan(0);
      expect(g.ad.length).toBeGreaterThan(0);
    }
  });
});
