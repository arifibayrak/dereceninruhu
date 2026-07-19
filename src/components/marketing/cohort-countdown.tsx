"use client";

import { useEffect, useState } from "react";

/**
 * Dönem kayıt kapanışına kalan süre — saniyede bir güncellenir. Saat okuma
 * yalnız client'ta; ilk render'da (`now = null`) sakin bir yer tutucu gösterir,
 * böylece hidratlama uyumsuzluğu olmaz. Tüm cümleyi bu bileşen kurar; agresif
 * değil, sakin/premium (bkz. AGENTS.md — genuine FOMO).
 */
export function CohortCountdown({
  closesOnMs,
  className,
}: {
  closesOnMs: number;
  className?: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());
    const first = setTimeout(update, 0);
    const id = setInterval(update, 1_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  // İlk paint (ve SSR) — nötr ifade.
  if (now === null) {
    return <span className={className}>yakında kapanıyor</span>;
  }

  const diff = closesOnMs - now;
  if (diff <= 0) {
    return <span className={className}>artık kapandı</span>;
  }

  const totalSec = Math.floor(diff / 1000);
  const d = Math.floor(totalSec / 86_400);
  const h = Math.floor((totalSec % 86_400) / 3_600);
  const m = Math.floor((totalSec % 3_600) / 60);
  const s = totalSec % 60;

  return (
    <span className={className}>
      <span className="font-heading font-bold tabular-nums">
        {d > 0 && `${d}g `}
        {String(h).padStart(2, "0")}s {String(m).padStart(2, "0")}dk{" "}
        {String(s).padStart(2, "0")}sn
      </span>{" "}
      içinde kapanıyor
    </span>
  );
}
