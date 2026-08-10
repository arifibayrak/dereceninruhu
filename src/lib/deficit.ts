/**
 * Deneme analizlerinden gelen konu eksiklerini DERS DERS gruplar.
 *
 * "Toplam eksik" tek karışık sıralamadır: baskın ders (örn. Türkçe) ilk 8 satırı
 * yiyip Coğrafya'yı hiç göstermeyebilir. Bu yardımcı her dersten yalnız en çok
 * eksik verilen N konuyu ayırır, böylece koç "bu öğrencinin Coğrafya'daki en
 * zayıf konusu ne?" sorusunu da cevaplayabilir.
 *
 * Gruplama konunun KENDİ dersiyle yapılır; alt dersler (Geometri, Kimya…) üst
 * derse KATLANMAZ — "Fen Bilimleri" altında toplayınca baskın alt ders yine
 * listeyi yerdi. Renk üst dersten devralınır (bkz. getTopicDeficits).
 */

import type { TopicDeficit } from "@/db/queries/analiz";

export type SubjectDeficitTopic = {
  topicId: number;
  topicName: string;
  total: number;
};

export type SubjectDeficitGroup = {
  subjectId: number;
  subjectName: string;
  chartColor: string | null;
  /** Dersin TÜM konularındaki toplam eksik — gösterilen N ile sınırlı değil. */
  total: number;
  /** Eksik verilen farklı konu sayısı — yine gösterilenle sınırlı değil. */
  topicCount: number;
  /** Çoktan aza, en fazla `perSubject` tane. */
  topics: SubjectDeficitTopic[];
};

/**
 * Konu eksiklerini derse göre gruplar; her dersten ilk `perSubject` konuyu tutar.
 * Konular ve gruplar çoktan aza sıralanır (girdinin sırasına güvenilmez),
 * eşitlikte Türkçe alfabetik.
 */
export function groupDeficitsBySubject(
  deficits: TopicDeficit[],
  perSubject = 5,
): SubjectDeficitGroup[] {
  const bySubject = new Map<
    number,
    Omit<SubjectDeficitGroup, "topicCount" | "topics"> & {
      /** Kesilmeden önceki tüm konular. */
      all: SubjectDeficitTopic[];
    }
  >();

  for (const d of deficits) {
    let group = bySubject.get(d.subjectId);
    if (!group) {
      group = {
        subjectId: d.subjectId,
        subjectName: d.subjectName,
        chartColor: d.chartColor,
        total: 0,
        all: [],
      };
      bySubject.set(d.subjectId, group);
    }
    group.total += d.total;
    group.all.push({
      topicId: d.topicId,
      topicName: d.topicName,
      total: d.total,
    });
  }

  return [...bySubject.values()]
    .map(({ all, ...group }) => ({
      ...group,
      topicCount: all.length,
      topics: [...all]
        .sort(
          (a, b) =>
            b.total - a.total || a.topicName.localeCompare(b.topicName, "tr"),
        )
        .slice(0, perSubject),
    }))
    .sort(
      (a, b) =>
        b.total - a.total || a.subjectName.localeCompare(b.subjectName, "tr"),
    );
}
