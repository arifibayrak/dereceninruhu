/**
 * Akış (walkthrough) veri tipleri.
 *
 * Rehber ekran ekran anlatır; akış ise **sıra** anlatır: hangi iş kimden
 * başlar, hangi butona basılınca ne üretilir ve bir sonraki adımı kim devralır.
 * Asıl değeri rollerin birbirine devrettiği yerleri görünür kılmasıdır —
 * "koç Yayınla'ya basmadan öğrenci programı görmez" gibi.
 */

/** Adımı kimin yaptığı — akışta şerit rengi ve rozeti bunu izler. */
export type Actor = "ogrenci" | "koc" | "yonetici" | "sistem";

export const ACTOR_LABEL: Record<Actor, string> = {
  ogrenci: "Öğrenci",
  koc: "Koç",
  yonetici: "Yönetici",
  sistem: "Sistem",
};

export type FlowStep = {
  id: string;
  actor: Actor;
  title: string;
  /** Bu adımın geçtiği ekran. */
  where?: string;
  /** Adımın ne olduğunu anlatan tek cümle. */
  summary: string;
  /** Adımda basılan gerçek butonlar — etiketler uygulamayla birebir. */
  buttons?: { label: string; does: string }[];
  /** Adım bitince ortaya çıkan şey (kayıt, durum değişikliği, bildirim). */
  outcome: string;
  /**
   * Devir noktası: bu adım tamamlanmadan sonraki adım yapılamaz.
   * Akışta kırmızı/altın bir "kapı" olarak gösterilir.
   */
  gate?: string;
  /** İlgili rehber bölümü — `#bolum-<id>`. */
  section?: string;
};

export type Flow = {
  id: string;
  title: string;
  description: string;
  /** Akışın ne zaman çalıştığı, ör. "Bir kez", "Her hafta". */
  cadence: string;
  steps: FlowStep[];
};
