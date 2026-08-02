"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { isStaleVersionError, STALE_VERSION_ERROR } from "@/lib/action-client";

/**
 * Emniyet ağı: yeni sürüm yayınlandıktan sonra AÇIK KALMIŞ sekmelerde her Server
 * Action çağrısı "action id bulunamadı" ile reddedilir. `callAction`'dan geçen
 * çağrılar bunu forma taşır; buradan geçmeyenlerde (ör. `<form action={...}>`,
 * router prefetch) hata hiçbir yere düşmez ve kullanıcı sadece "donmuş" bir
 * ekran görür.
 *
 * Bu bileşen o sahipsiz reddi yakalar ve kullanıcıya tek yapılacak şeyi söyler:
 * sayfayı yenile. Yalnız sürüm uyuşmazlığını dinler — başka promise hataları
 * (eklentiler, iptal edilen istekler) kullanıcıya yansıtılmaz.
 */
export function StaleVersionWatch() {
  const shown = useRef(false);

  useEffect(() => {
    const onRejection = (event: PromiseRejectionEvent) => {
      if (shown.current || !isStaleVersionError(event.reason)) return;
      shown.current = true;
      // Konsolu "Uncaught (in promise)" ile kirletme — mesajı biz gösteriyoruz.
      event.preventDefault();
      toast.error(STALE_VERSION_ERROR, {
        duration: Infinity,
        action: {
          label: "Yenile",
          onClick: () => window.location.reload(),
        },
      });
    };

    window.addEventListener("unhandledrejection", onRejection);
    return () => window.removeEventListener("unhandledrejection", onRejection);
  }, []);

  return null;
}
