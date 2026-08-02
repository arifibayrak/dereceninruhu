/**
 * Maliyet hesabı — yönetici panelindeki tek doğruluk kaynağı.
 *
 * Buradaki her sabit ELLE güncellenir; hepsinin yanında ölçüm/ilan tarihi var.
 * Fiyatlar veritabanına YAZILMAZ: `ai_usage_log` yalnız jeton sayısı tutar,
 * TL/USD karşılığı okuma anında burada hesaplanır. Böylece fiyat ya da kur
 * değiştiğinde geçmiş satırlara dokunmadan tüm rapor güncellenir.
 *
 * Para birimi kuralı: proje geneli para = tamsayı kuruş. Bu modül USD ile
 * hesaplayıp sonuçları kuruşa çevirir (`usdToKurus`), böylece görüntüleme
 * tarafı `formatKurus` ile aynı yoldan geçer.
 */

/** 1 USD kaç TL. Panelde tarihiyle gösterilir — bayatlayınca elle güncellenir. */
export const USD_TRY = 47.4;
export const USD_TRY_TARIHI = "2026-08-02";

/**
 * Model fiyatları — milyon jeton başına USD (Anthropic/OpenAI ilan listesi).
 *
 * Hem OpenRouter slug'ları (uygulamanın kendi çağrıları) hem düz Anthropic
 * kimlikleri (Claude Code geliştirme kayıtları) burada; iki taraf da aynı
 * fiyat tablosundan geçsin diye.
 */
export const MODEL_FIYAT: Record<string, { girdi: number; cikti: number }> = {
  "anthropic/claude-haiku-4.5": { girdi: 1, cikti: 5 },
  "anthropic/claude-sonnet-4.6": { girdi: 3, cikti: 15 },
  "anthropic/claude-opus-4.8": { girdi: 5, cikti: 25 },
  // Geliştirme (Claude Code) tarafı:
  "claude-haiku-4-5": { girdi: 1, cikti: 5 },
  "claude-sonnet-4-6": { girdi: 3, cikti: 15 },
  "claude-sonnet-5": { girdi: 3, cikti: 15 },
  "claude-opus-4-6": { girdi: 5, cikti: 25 },
  "claude-opus-4-7": { girdi: 5, cikti: 25 },
  "claude-opus-4-8": { girdi: 5, cikti: 25 },
  "claude-opus-5": { girdi: 5, cikti: 25 },
  "claude-fable-5": { girdi: 10, cikti: 50 },
};

/** Önbellek YAZMA çarpanları: 5 dakikalık %125, 1 saatlik %200 (girdi fiyatı üzerinden). */
export const ONBELLEK_YAZMA_5DK = 1.25;
export const ONBELLEK_YAZMA_1SA = 2;

/** Ses→metin: dakika başına USD (OpenRouter, whisper-large-v3-turbo). */
export const SES_FIYAT_DAKIKA = 0.0015;
/** Bilinmeyen model için varsayılan — panelde "fiyatı tanımsız" olarak işaretlenir. */
export const VARSAYILAN_FIYAT = { girdi: 1, cikti: 5 };

/** Önbellekten okunan girdi, normal girdinin onda biri fiyatlanır. */
const ONBELLEK_CARPANI = 0.1;

const MILYON = 1_000_000;

export type Kullanim = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  audioSeconds: number | null;
  /** Önbelleğe YAZILAN jetonlar — yalnız geliştirme kayıtlarında dolu. */
  cacheWrite5mTokens?: number;
  cacheWrite1hTokens?: number;
};

/** Tek bir kullanım satırının USD maliyeti. */
export function kullanimUsd(k: Kullanim): number {
  if (k.audioSeconds != null && k.audioSeconds > 0) {
    return (k.audioSeconds / 60) * SES_FIYAT_DAKIKA;
  }
  const f = MODEL_FIYAT[k.model] ?? VARSAYILAN_FIYAT;
  // Önbellekten okunan jetonlar `inputTokens`'a DAHİL DEĞİL (AI SDK ayrı verir).
  return (
    (k.inputTokens / MILYON) * f.girdi +
    (k.cachedInputTokens / MILYON) * f.girdi * ONBELLEK_CARPANI +
    ((k.cacheWrite5mTokens ?? 0) / MILYON) * f.girdi * ONBELLEK_YAZMA_5DK +
    ((k.cacheWrite1hTokens ?? 0) / MILYON) * f.girdi * ONBELLEK_YAZMA_1SA +
    (k.outputTokens / MILYON) * f.cikti
  );
}

/** USD → tamsayı kuruş (TL). Proje geneli para birimi kuralı. */
export function usdToKurus(usd: number): number {
  return Math.round(usd * USD_TRY * 100);
}

/* -------------------------------------------------------------------------- */
/*  Sabit altyapı giderleri                                                    */
/* -------------------------------------------------------------------------- */

export type GiderKalemi = {
  ad: string;
  /** Aylık USD. Yıllık ödenen kalemler 12'ye bölünmüş halde yazılır. */
  aylikUsd: number;
  aciklama: string;
  /** true = kullanım arttıkça büyür; false = sabit abonelik. */
  degisken: boolean;
};

/**
 * Aylık yinelenen sabit giderler (2 Ağustos 2026 itibarıyla doğrulandı).
 * AI kalemi burada YOK — o, gerçek kullanımdan hesaplanır.
 */
export const SABIT_GIDERLER: GiderKalemi[] = [
  {
    ad: "Cloudflare Workers Paid",
    aylikUsd: 5,
    aciklama: "Uygulama sunucusu. D1 veritabanı ve R2 dosya deposu bu pakete dahil.",
    degisken: false,
  },
  {
    ad: "Alan adı — dereceninruhu.com",
    aylikUsd: 10.44 / 12,
    aciklama: "Cloudflare Registrar, yılda 10,44 USD. 18 Temmuz'da yenilenir.",
    degisken: false,
  },
  {
    ad: "Claude Max 20× — geliştirme",
    aylikUsd: 200,
    aciklama:
      "Geliştirme aboneliği. Uygulamanın çalışması için gerekmez; yeni özellik geliştikçe sürer.",
    degisken: false,
  },
];

/* -------------------------------------------------------------------------- */
/*  Geliştirme maliyeti — tek seferlik ölçüm                                   */
/* -------------------------------------------------------------------------- */

/**
 * 18 Tem – 2 Ağu 2026 arası Claude Code oturum kayıtlarından sayıldı
 * (95 oturum, yinelenen API yanıtları ayıklanarak).
 */
export const GELISTIRME = {
  baslangic: "2026-07-18",
  bitis: "2026-08-02",
  gun: 15,
  cagri: 6686,
  toplamJeton: 1_673_669_204,
  ciktiJeton: 5_673_052,
  /** Anthropic liste fiyatıyla bu jetonların karşılığı. */
  apiDegeriUsd: 1215.11,
  /** Fiilen ödenen nakit: abonelik + altyapı + OpenRouter. */
  nakitUsd: 220.44,
  modeller: [
    { ad: "Claude Opus 4.8", cagri: 3431, jeton: 949_258_852, usd: 686.31 },
    { ad: "Claude Opus 5", cagri: 2967, jeton: 687_379_791, usd: 467.4 },
    { ad: "Claude Fable 5", cagri: 288, jeton: 33_197_107, usd: 61.4 },
  ],
} as const;

/* -------------------------------------------------------------------------- */
/*  Projeksiyon                                                                */
/* -------------------------------------------------------------------------- */

/** R2 ücretsiz kotası (GB) ve aşım fiyatı — büyüme projeksiyonunda kullanılır. */
export const R2_UCRETSIZ_GB = 10;
export const R2_GB_USD = 0.015;

export type Projeksiyon = {
  ogrenci: number;
  aylikUsd: number;
  ogrenciBasinaUsd: number;
};

/**
 * Hedef öğrenci sayısında aylık gider.
 *
 * Model: sabit giderler + (öğrenci başına AI × öğrenci) + R2 aşımı.
 * `aiOgrenciBasinaUsd` mevcut GERÇEK kullanımdan türetilir — uydurma katsayı yok.
 */
export function projeksiyon(
  ogrenci: number,
  aiOgrenciBasinaUsd: number,
  r2KullanilanGb = 0,
  sabitler: GiderKalemi[] = SABIT_GIDERLER,
): Projeksiyon {
  const sabit = sabitler.reduce((t, g) => t + g.aylikUsd, 0);
  const ai = aiOgrenciBasinaUsd * ogrenci;
  // Depolama öğrenciyle doğru orantılı büyür varsayımı.
  const r2Gb = ogrenci > 0 ? r2KullanilanGb * ogrenci : 0;
  const r2 = Math.max(0, r2Gb - R2_UCRETSIZ_GB) * R2_GB_USD;
  const aylikUsd = sabit + ai + r2;
  return {
    ogrenci,
    aylikUsd,
    ogrenciBasinaUsd: ogrenci > 0 ? aylikUsd / ogrenci : aylikUsd,
  };
}

/** Panelde gösterilen basamaklar. */
export const PROJEKSIYON_BASAMAKLARI = [100, 250, 500, 1000] as const;
