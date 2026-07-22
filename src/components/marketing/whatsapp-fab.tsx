"use client";

import { useEffect, useState } from "react";

import { WhatsappIcon } from "@/components/brand/social-icons";
import { cn } from "@/lib/utils";

/**
 * Yüzen WhatsApp İşletme butonu — pazarlama sitesinin sağ alt köşesi.
 *
 * Link `buildWaLink()` ile sunucuda kurulur (bu bileşen yalnız görünürlük
 * animasyonu için client). Otomatik gönderim yok: kullanıcı WhatsApp'a hazır
 * mesajla düşer, göndermeye kendisi karar verir.
 *
 * Davranış: ilk ~120px kaydırmadan sonra belirir (hero'nun CTA'sıyla
 * yarışmasın), sonra sabit kalır. Marka sesi sakin — yanıp sönme, pop-up yok.
 */
export function WhatsappFab({
  href,
  label = "WhatsApp'tan yaz",
}: {
  href: string;
  label?: string;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 120);
    onScroll(); // sayfa ortasından açıldıysa (derin link) hemen göster
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} (yeni sekmede WhatsApp'ta açılır)`}
      className={cn(
        // Alt gezinme çubuğu olmayan public sitede sağ-alt sabit.
        "fixed right-4 bottom-4 z-50 inline-flex items-center gap-2.5 rounded-full",
        "bg-[#25D366] py-3 pr-5 pl-4 font-medium text-[#04310f] shadow-lg shadow-black/20",
        "transition-all duration-300 ease-out hover:brightness-105 active:scale-[0.97]",
        "focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
        "motion-reduce:transition-none sm:right-6 sm:bottom-6",
        shown
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <WhatsappIcon className="size-6" />
      <span className="text-sm whitespace-nowrap">{label}</span>
    </a>
  );
}
