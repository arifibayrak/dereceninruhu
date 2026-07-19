import type { CohortSettings } from "@/db/schema";

/**
 * Dönem/kontenjan görünüm modeli — public bileşenler bunu kullanır. Sayılar
 * yöneticinin yayımlamayı seçtiği PAZARLAMA değerleridir; gerçek kapasite/kayıt
 * ASLA buraya girmez (bkz. AGENTS.md — premium konumlandırma).
 */
export type CohortView = {
  label: string;
  /** Kıtlık mesajları sitede görünsün mü (ana şalter). */
  visible: boolean;
  /** Dönem doldu/kapandı → enroll CTA'ları bekleme listesine döner. */
  isFull: boolean;
  /** "Son kontenjan" vurgusu. */
  isClosingSoon: boolean;
  waitlistOpen: boolean;
  /** Gösterilen kalan kontenjan; kapasite girilmediyse null (sayı gösterilmez). */
  remaining: number | null;
  capacity: number | null;
  closesOn: Date | null;
};

export function cohortView(c: CohortSettings): CohortView {
  const isFull = c.status === "dolu" || c.status === "kapali";
  const remaining =
    c.displayCapacity != null
      ? Math.max(c.displayCapacity - c.displayFilled, 0)
      : null;
  return {
    label: c.donemLabel,
    visible: c.scarcityVisible,
    isFull,
    isClosingSoon: c.status === "son_kontenjan",
    waitlistOpen: c.waitlistOpen,
    // Dolu olduğunda "kalan" gösterilmez.
    remaining: isFull ? 0 : remaining,
    capacity: c.displayCapacity,
    closesOn: c.closesOn,
  };
}

/** Kayıtlar açık mı — açık değilse ön görüşme CTA'ları bekleme listesine döner. */
export function enrollmentOpen(c: CohortSettings): boolean {
  return c.status !== "dolu" && c.status !== "kapali";
}
