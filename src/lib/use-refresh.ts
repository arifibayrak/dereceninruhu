"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * `router.refresh()`in tek doğru çağrılma biçimi: bir geçiş (transition) içinde.
 *
 * NEDEN: `/ogrenci` ve `/koc` kabukları `force-dynamic`. Çıplak bir
 * `router.refresh()` tüm rota ağacını (oturum okuması dahil) yeniden çalıştırır
 * ve sonucu SERT bir takasla basar — arayüz o sırada donar, iyimser güncelleme
 * geri seker. Geçiş içinde aynı iş engellemeyen olur: eski ekran etkileşime
 * açık kalır, yeni veri hazır olunca yerleşir.
 *
 * `refreshing`, istersen "güncelleniyor" göstermek için; kullanmak zorunlu değil.
 *
 * ```ts
 * const { refresh } = useRefresh();
 * const res = await callAction(saveThing, payload);
 * if (res.ok) refresh();
 * ```
 */
export function useRefresh() {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  return { refresh, refreshing };
}
