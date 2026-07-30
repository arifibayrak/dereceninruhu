/**
 * Deneme temposu — süre + soru sayısından soru başına saniye.
 *
 * Branş denemesinde asıl mesele hızdır: net aynı kalsa bile süre kısalıyorsa
 * öğrenci ilerliyor demektir. Tempo bu yüzden HER ZAMAN aynı ders(ler)in
 * önceki denemesiyle kıyaslanır — `paceKey` o eşleştirmenin anahtarıdır.
 * Süre opsiyoneldir; girilmemiş denemede tempo yoktur (null), uydurulmaz.
 */

/** Soru başına saniye. Süre ya da soru sayısı yoksa null. */
export function secondsPerQuestion(
  durationMinutes: number | null | undefined,
  questionCount: number,
): number | null {
  if (!durationMinutes || durationMinutes <= 0) return null;
  if (!questionCount || questionCount <= 0) return null;
  return (durationMinutes * 60) / questionCount;
}

/** 52,4 → "52 sn/soru". */
export function formatPace(secondsPerQ: number): string {
  return `${Math.round(secondsPerQ)} sn/soru`;
}

/**
 * Aynı denemeleri eşleştiren anahtar: denemedeki puanlanan derslerin sıralı
 * id'leri. Tek dersli branş denemeleri ("TYT Türkçe") böylece yalnız kendi
 * dersinin geçmişiyle kıyaslanır, başka bir branşla karışmaz.
 */
export function paceKey(subjectIds: number[]): string {
  return [...subjectIds].sort((a, b) => a - b).join("-");
}

/**
 * Bir önceki aynı-ders denemesine göre tempo farkı, saniye.
 * NEGATİF = hızlanmış (iyi), pozitif = yavaşlamış.
 */
export function paceDelta(current: number, previous: number): number {
  return current - previous;
}

/** −6,2 → "6 sn hızlandın"; +4 → "4 sn yavaşladın"; ~0 → "aynı tempo". */
export function formatPaceDelta(delta: number): string {
  const s = Math.round(Math.abs(delta));
  if (s === 0) return "aynı tempo";
  return delta < 0 ? `${s} sn hızlandın` : `${s} sn yavaşladın`;
}

/** Listelerde kullanılan kısa biçim: "−6 sn" / "+4 sn". */
export function formatPaceDeltaShort(delta: number): string {
  const s = Math.round(Math.abs(delta));
  if (s === 0) return "0 sn";
  return `${delta < 0 ? "−" : "+"}${s} sn`;
}

/**
 * Bir denemenin tempo satırı — süre girilmişse tempo, öncekiyle kıyas varsa
 * fark. Liste sayfaları bunu tek çağrıda alır (aynı mantık kopyalanmasın).
 */
export type PaceView = {
  seconds: number;
  label: string;
  delta: number | null;
  deltaLabel: string | null;
  /** Hızlandı mı — renklendirme için (null: kıyas yok ya da fark yok). */
  faster: boolean | null;
};

/**
 * Denemeleri YENİDEN ESKİYE sıralı alır, her deneme için tempo görünümü
 * döndürür (id → PaceView). Kıyas, aynı `paceKey`'e sahip bir ÖNCEKİ
 * (daha eski) denemedir.
 */
export function buildPaceViews<
  T extends {
    id: number;
    durationMinutes: number | null;
    questionCount: number;
    subjectIds: number[];
  },
>(mocksNewestFirst: T[]): Map<number, PaceView> {
  const out = new Map<number, PaceView>();
  // Eskiden yeniye ilerleyip her anahtarın son temposunu hatırlarız.
  const lastByKey = new Map<string, number>();
  for (let i = mocksNewestFirst.length - 1; i >= 0; i--) {
    const m = mocksNewestFirst[i];
    const seconds = secondsPerQuestion(m.durationMinutes, m.questionCount);
    if (seconds == null) continue;
    const key = paceKey(m.subjectIds);
    const prev = lastByKey.get(key);
    const delta = prev != null ? paceDelta(seconds, prev) : null;
    out.set(m.id, {
      seconds,
      label: formatPace(seconds),
      delta,
      deltaLabel: delta != null ? formatPaceDeltaShort(delta) : null,
      faster: delta == null || Math.round(delta) === 0 ? null : delta < 0,
    });
    lastByKey.set(key, seconds);
  }
  return out;
}
