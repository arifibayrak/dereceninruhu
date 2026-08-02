import { and, eq, gte, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  aiUsageLog,
  devUsageSnapshot,
  enrollments,
  students,
} from "@/db/schema";
import { kullanimUsd, type Kullanim } from "@/lib/maliyet";

export type FeatureKullanim = {
  feature: string;
  model: string;
  cagri: number;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  audioSeconds: number;
  usd: number;
};

const FEATURE_ADI: Record<string, string> = {
  "program-taslak": "Program taslağı (AI)",
  "koc-asistani": "Koç asistanı",
  "ogrenci-sohbet": "Öğrenci sohbeti",
  "transkript-cikarim": "Görüşme çıkarımı",
  "ekstre-cikarim": "Ekstre okuma (muhasebe)",
  "ses-metin": "Ses → metin",
};

export const featureAdi = (k: string) => FEATURE_ADI[k] ?? k;

/**
 * Verilen aralıktaki AI kullanımı — özellik × model kırılımında.
 *
 * Maliyet SQL'de değil burada hesaplanır: fiyatlar `@/lib/maliyet`'te yaşıyor
 * ve değiştiğinde geçmiş satırların yeniden fiyatlanması isteniyor.
 */
export async function getAiKullanim(
  baslangic: Date,
  bitis: Date,
): Promise<FeatureKullanim[]> {
  const rows = await getDb()
    .select({
      feature: aiUsageLog.feature,
      model: aiUsageLog.model,
      cagri: sql<number>`count(*)`,
      inputTokens: sql<number>`coalesce(sum(${aiUsageLog.inputTokens}), 0)`,
      outputTokens: sql<number>`coalesce(sum(${aiUsageLog.outputTokens}), 0)`,
      cachedInputTokens: sql<number>`coalesce(sum(${aiUsageLog.cachedInputTokens}), 0)`,
      audioSeconds: sql<number>`coalesce(sum(${aiUsageLog.audioSeconds}), 0)`,
    })
    .from(aiUsageLog)
    .where(
      and(gte(aiUsageLog.createdAt, baslangic), lt(aiUsageLog.createdAt, bitis)),
    )
    .groupBy(aiUsageLog.feature, aiUsageLog.model);

  return rows
    .map((r) => {
      const k: Kullanim = {
        model: r.model,
        inputTokens: Number(r.inputTokens),
        outputTokens: Number(r.outputTokens),
        cachedInputTokens: Number(r.cachedInputTokens),
        audioSeconds: Number(r.audioSeconds) || null,
      };
      return {
        feature: r.feature,
        model: r.model,
        cagri: Number(r.cagri),
        inputTokens: k.inputTokens,
        outputTokens: k.outputTokens,
        cachedInputTokens: k.cachedInputTokens,
        audioSeconds: Number(r.audioSeconds),
        usd: kullanimUsd(k),
      };
    })
    .sort((a, b) => b.usd - a.usd);
}

/** Panelin üst şeridi için: aktif öğrenci ve kayıt sayısı. */
export async function getOlcek(): Promise<{ ogrenci: number; kayit: number }> {
  const db = getDb();
  const [row] = await db
    .select({
      ogrenci: sql<number>`(select count(*) from ${students} where ${students.status} = 'active' and ${students.deletedAt} is null)`,
      kayit: sql<number>`(select count(*) from ${enrollments} where ${enrollments.status} = 'active')`,
    })
    .from(sql`(select 1) as _`);
  return { ogrenci: Number(row?.ogrenci ?? 0), kayit: Number(row?.kayit ?? 0) };
}

export type GelistirmeOlcum = {
  measuredAt: Date;
  firstAt: Date | null;
  lastAt: Date | null;
  toplamJeton: number;
  ciktiJeton: number;
  cagri: number;
  usd: number;
  modeller: { model: string; cagri: number; jeton: number; usd: number }[];
};

/**
 * En son geliştirme ölçümü (`scripts/gelistirme-maliyeti.mjs` her dağıtımda yazar).
 * Hiç ölçüm yoksa null — panel o zaman "henüz ölçülmedi" der.
 */
export async function getSonGelistirmeOlcumu(): Promise<GelistirmeOlcum | null> {
  const db = getDb();
  const [son] = await db
    .select({ measuredAt: sql<number | null>`max(${devUsageSnapshot.measuredAt})` })
    .from(devUsageSnapshot);
  const anahtar = son?.measuredAt;
  if (!anahtar) return null;

  const rows = await db
    .select()
    .from(devUsageSnapshot)
    .where(eq(devUsageSnapshot.measuredAt, new Date(Number(anahtar) * 1000)));
  if (rows.length === 0) return null;

  const modeller = rows
    .map((r) => {
      const jeton =
        r.inputTokens +
        r.outputTokens +
        r.cacheReadTokens +
        r.cacheWrite5mTokens +
        r.cacheWrite1hTokens;
      return {
        model: r.model,
        cagri: r.calls,
        jeton,
        usd: kullanimUsd({
          model: r.model,
          inputTokens: r.inputTokens,
          outputTokens: r.outputTokens,
          cachedInputTokens: r.cacheReadTokens,
          cacheWrite5mTokens: r.cacheWrite5mTokens,
          cacheWrite1hTokens: r.cacheWrite1hTokens,
          audioSeconds: null,
        }),
      };
    })
    .sort((a, b) => b.usd - a.usd);

  return {
    measuredAt: rows[0].measuredAt,
    firstAt: rows[0].firstAt,
    lastAt: rows[0].lastAt,
    toplamJeton: modeller.reduce((t, m) => t + m.jeton, 0),
    ciktiJeton: rows.reduce((t, r) => t + r.outputTokens, 0),
    cagri: modeller.reduce((t, m) => t + m.cagri, 0),
    usd: modeller.reduce((t, m) => t + m.usd, 0),
    modeller,
  };
}

/** Kayıt tutulmaya ne zaman başlandı — panelde "veri bu tarihten itibaren" notu. */
export async function getIlkKullanimTarihi(): Promise<Date | null> {
  const [row] = await getDb()
    .select({ ilk: sql<number | null>`min(${aiUsageLog.createdAt})` })
    .from(aiUsageLog);
  const v = row?.ilk;
  return v ? new Date(Number(v) * 1000) : null;
}
