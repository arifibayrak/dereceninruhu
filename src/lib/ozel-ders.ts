import { trDayKey } from "@/lib/dates";

/**
 * Özel ders hakkı ve süre hesapları. Framework-free — Server Action'lar,
 * sorgu katmanı ve testler aynı fonksiyonları çağırır (`@/lib/net` deseni).
 *
 * TEK DOĞRULUK KAYNAĞI: kalan hak hiçbir yerde SAKLANMAZ, her okumada işlenen
 * derslerden türetilir. Saklansaydı iptal/telafi/süre düzeltmesi sonrası sayaç
 * gerçekle ayrışırdı.
 *
 * Yenilenen paketler (haftada 1 saat, ayda 4 saat) de aynı ilkeyi izler:
 * tanınan hak, `startsOn`dan bugüne geçen dönem sayısıyla ÇARPILARAK türetilir.
 * Arka planda hak ekleyen bir cron YOKTUR — olsaydı iş bir kez atlandığında ya
 * da iki kez koştuğunda sayaç sessizce yanlışa düşerdi ve kimse fark etmezdi.
 *
 * Kullanılmayan saat YANMAZ, birikir: öğrenci parasını ödediği hakkı bir hafta
 * kullanamadı diye kaybetmemeli. Süreli yakma istenirse `endsOn` ile sınırla.
 */

export type Renewal = "yok" | "haftalik" | "aylik";

export const RENEWAL_LABELS: Record<Renewal, string> = {
  yok: "Yenilenmez (tek seferlik)",
  haftalik: "Her hafta yenilenir",
  aylik: "Her ay yenilenir",
};

/**
 * Bir tarihin Türkiye takvimindeki gün numarası (epoch-gün).
 *
 * Saat dilimi tuzağı: kayıtlar TRT gece yarısı damgasıyla saklanıyor, Worker
 * ise UTC'de koşuyor. `getMonth()` doğrudan okunursa ayın 1'i bir önceki aya
 * düşer ve dönem sayısı bir eksik çıkar. O yüzden gün/ay/yıl DAİMA `trDayKey`
 * metninden okunur.
 */
function trParts(d: Date): { y: number; m: number; day: number } {
  const [y, m, day] = trDayKey(d).split("-").map(Number);
  return { y, m, day };
}

function trDayNumber(d: Date): number {
  const { y, m, day } = trParts(d);
  return Math.floor(Date.UTC(y, m - 1, day) / 86_400_000);
}

/**
 * `startsOn`dan `now`a kadar BAŞLAMIŞ dönem sayısı (en az 1).
 *
 * Başlangıç günü 1. dönemdir: paketi bugün alan öğrenci bugün hakkını
 * kullanabilmeli. `endsOn` geçmişse birikim orada durur.
 */
export function periodsElapsed(
  startsOn: Date | null | undefined,
  now: Date,
  cadence: Exclude<Renewal, "yok">,
  endsOn?: Date | null,
): number {
  if (!startsOn) return 0;
  const end =
    endsOn && endsOn.getTime() < now.getTime() ? endsOn : now;
  if (trDayNumber(end) < trDayNumber(startsOn)) return 0;

  if (cadence === "haftalik") {
    const days = trDayNumber(end) - trDayNumber(startsOn);
    return Math.floor(days / 7) + 1;
  }

  const s = trParts(startsOn);
  const e = trParts(end);
  let months = (e.y - s.y) * 12 + (e.m - s.m);
  // Ayın günü henüz gelmediyse o ay başlamamıştır (15'inde alınan paket,
  // sonraki ayın 10'unda hâlâ 1. dönemdedir).
  if (e.day < s.day) months -= 1;
  return months + 1;
}

/** Bir paket atamasının BUGÜNE KADAR tanınmış toplam saati. */
export function accruedHours(
  pkg: {
    renewal: Renewal;
    lessonHoursGranted: number;
    hoursPerPeriod: number;
    startsOn: Date | null;
    endsOn: Date | null;
  },
  now: Date = new Date(),
): number {
  if (pkg.renewal === "yok") return pkg.lessonHoursGranted;
  const periods = periodsElapsed(pkg.startsOn, now, pkg.renewal, pkg.endsOn);
  return periods * pkg.hoursPerPeriod;
}

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
