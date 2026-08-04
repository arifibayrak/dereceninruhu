import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Kahraman metin sütununu ilk yüklemede yumuşakça belirtir (fade-up).
 *
 * ⚠️ SUNUCU BİLEŞENİ — bilerek. Burası sayfanın LCP öğesini (<h1>) sarar.
 * Önceden `motion.div` idi ve `initial={{opacity:0}}` sunucudan gelen HTML'e
 * `style="opacity:0;transform:translateY(16px)"` yazıyordu; başlık ancak ~320KB
 * JS inip React hidrate olduktan sonra görünür oluyordu. Mobilde LCP'nin
 * 6,2 sn'sinin 4,5 sn'si bu bekleyişti.
 *
 * Şimdi giriş animasyonu salt CSS (`.hero-in`, globals.css): tarayıcı ilk
 * boyamada başlatır, JS beklemez. Buraya "use client" / motion GERİ EKLEME.
 */
export function HeroReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("hero-in", className)}>{children}</div>;
}
