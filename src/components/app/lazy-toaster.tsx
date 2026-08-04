"use client";

import dynamic from "next/dynamic";

/**
 * Toaster'ı KRİTİK YOLDAN çıkarır.
 *
 * `sonner` + shadcn sarmalayıcısı ~14KB gzip ve kök layout'ta olduğu için her
 * sayfaya — tek bir bildirim göstermeyen pazarlama sayfalarına da — ilk paketle
 * giriyordu. Mobilde LCP penceresinde bant genişliği yiyordu.
 *
 * `ssr: false` + dinamik import: ayrı bir parçaya taşınır ve ancak hidrasyondan
 * SONRA yüklenir. Toast'lar yalnız kullanıcı etkileşimiyle (form gönderimi)
 * tetiklendiği için o ana kadar Toaster çoktan bağlanmış olur.
 *
 * Not: Toaster sunucuda hiçbir şey çizmiyordu zaten (portal) — `ssr: false`
 * görsel bir fark yaratmaz.
 */
const Toaster = dynamic(
  () => import("@/components/ui/sonner").then((m) => m.Toaster),
  { ssr: false },
);

export function LazyToaster() {
  return <Toaster position="top-center" />;
}
