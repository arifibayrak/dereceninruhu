/**
 * Özel ders hakkı ve süre hesapları. Framework-free — Server Action'lar,
 * sorgu katmanı ve testler aynı fonksiyonları çağırır (`@/lib/net` deseni).
 *
 * TEK DOĞRULUK KAYNAĞI: kalan hak hiçbir yerde SAKLANMAZ, her okumada işlenen
 * derslerden türetilir. Saklansaydı iptal/telafi/süre düzeltmesi sonrası sayaç
 * gerçekle ayrışırdı.
 */

/** Kotadan düşen ders — hesaba giren asgari alanlar. */
export type QuotaLesson = {
  status: "scheduled" | "held" | "cancelled" | "missed";
  durationMinutes: number;
  countsAgainstQuota: boolean;
};

export type QuotaSummary = {
  /** Tanınan toplam hak (dakika). */
  grantedMinutes: number;
  /** İşlenmiş ve haktan düşen dersler (dakika). */
  usedMinutes: number;
  /** Planlanmış ama henüz işlenmemiş dersler (dakika) — "ayrılmış" hak. */
  scheduledMinutes: number;
  /** Kalan (dakika). Negatife düşmez; aşım `overusedMinutes`ta durur. */
  remainingMinutes: number;
  /** Hakkın üstüne işlenen ders (dakika); 0 = aşım yok. */
  overusedMinutes: number;
};

/**
 * Kotayı yalnız İŞLENMİŞ (`held`) dersler yakar.
 *
 * `scheduled` ayrı raporlanır: planlanan ders henüz gerçekleşmemiştir, iptal
 * edilebilir. "Kalan"dan düşseydi iptal sonrası hak geri verilmesi gerekirdi ve
 * o an sayaç yanlış kalırdı. `cancelled`/`missed` hiç düşmez — gelmediği için
 * öğrencinin hakkını yakmak iş kuralı değil, ceza olurdu; gerekirse koç o dersi
 * `held` + `countsAgainstQuota` ile işler.
 */
export function quotaSummary(
  grantedHours: number,
  lessons: readonly QuotaLesson[],
): QuotaSummary {
  const grantedMinutes = Math.max(0, Math.round(grantedHours * 60));

  let usedMinutes = 0;
  let scheduledMinutes = 0;
  for (const l of lessons) {
    if (!l.countsAgainstQuota) continue;
    const minutes = Math.max(0, l.durationMinutes);
    if (l.status === "held") usedMinutes += minutes;
    else if (l.status === "scheduled") scheduledMinutes += minutes;
  }

  return {
    grantedMinutes,
    usedMinutes,
    scheduledMinutes,
    remainingMinutes: Math.max(0, grantedMinutes - usedMinutes),
    overusedMinutes: Math.max(0, usedMinutes - grantedMinutes),
  };
}

/** Birden çok paketin haklarını tek sayaçta toplar (koçluk + özel ders). */
export function mergeQuota(parts: readonly QuotaSummary[]): QuotaSummary {
  const grantedMinutes = parts.reduce((a, p) => a + p.grantedMinutes, 0);
  const usedMinutes = parts.reduce((a, p) => a + p.usedMinutes, 0);
  return {
    grantedMinutes,
    usedMinutes,
    scheduledMinutes: parts.reduce((a, p) => a + p.scheduledMinutes, 0),
    remainingMinutes: parts.reduce((a, p) => a + p.remainingMinutes, 0),
    overusedMinutes: parts.reduce((a, p) => a + p.overusedMinutes, 0),
  };
}

/**
 * Dakikayı Türkçe saat/dakika metnine çevirir: 90 → "1 sa 30 dk".
 * Ders süreleri saat cinsinden konuşulur ama dakika saklanır.
 */
export function formatLessonMinutes(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) return `${m} dk`;
  if (m === 0) return `${h} sa`;
  return `${h} sa ${m} dk`;
}

export const LESSON_STATUS_LABELS: Record<QuotaLesson["status"], string> = {
  scheduled: "Planlandı",
  held: "İşlendi",
  cancelled: "İptal",
  missed: "Gelinmedi",
};

export const PACKAGE_KIND_LABELS = {
  kocluk: "Koçluk",
  ozel_ders: "Özel ders",
  /** Koçluk + belirli saat özel ders bir arada satılan paket. */
  kocluk_ozel_ders: "Koçluk + Özel ders",
} as const;

export type PackageKind = keyof typeof PACKAGE_KIND_LABELS;

export const ENROLLMENT_PACKAGE_STATUS_LABELS = {
  aktif: "Aktif",
  bitti: "Bitti",
  iptal: "İptal",
} as const;

/** Sık kullanılan ders süreleri (dakika) — koç formundaki hızlı seçenekler. */
export const LESSON_DURATION_OPTIONS = [30, 45, 60, 90, 120] as const;

/**
 * Eğitmen seçicisi tek bir metin değeri taşır (`u:<userId>` / `p:<profileId>`)
 * çünkü bir `<select>` tek değer döndürür. Burada iki kolona ayrılır.
 * Saf fonksiyon: hem istemci formu hem Server Action aynısını çağırır.
 */
export function parseInstructorValue(value: string | null | undefined): {
  instructorUserId: string | null;
  instructorProfileId: number | null;
} {
  if (!value) return { instructorUserId: null, instructorProfileId: null };
  if (value.startsWith("u:")) {
    return { instructorUserId: value.slice(2), instructorProfileId: null };
  }
  if (value.startsWith("p:")) {
    const id = Number(value.slice(2));
    return {
      instructorUserId: null,
      instructorProfileId: Number.isFinite(id) ? id : null,
    };
  }
  return { instructorUserId: null, instructorProfileId: null };
}

/** Kolon çiftini seçici değerine geri çevirir (formu doldururken). */
export function instructorValueOf(
  instructorUserId: string | null,
  instructorProfileId: number | null,
): string {
  if (instructorUserId) return `u:${instructorUserId}`;
  if (instructorProfileId) return `p:${instructorProfileId}`;
  return "";
}
