"use client";

import { useEffect, useRef } from "react";

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
      // preventDefault SENKRON çağrılmalı — import'u beklemeden.
      // Konsolu "Uncaught (in promise)" ile kirletme — mesajı biz gösteriyoruz.
      event.preventDefault();
      // `sonner` buradan statik import EDİLMEZ: kök layout'ta olduğu için her
      // sayfanın ilk paketine ~14KB gzip ekliyordu. Bu dal pratikte yalnız yeni
      // sürüm yayınlandığında çalışır; o an indirmek yeterli.
      void import("sonner").then(({ toast }) => {
        toast.error(STALE_VERSION_ERROR, {
          duration: Infinity,
          action: {
            label: "Yenile",
            onClick: () => window.location.reload(),
          },
        });
      });
    };

    window.addEventListener("unhandledrejection", onRejection);
    return () => window.removeEventListener("unhandledrejection", onRejection);
  }, []);

  return null;
}
