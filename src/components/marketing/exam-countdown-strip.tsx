import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { daysBetween } from "@/lib/dates";
import { EXAM_COUNTDOWNS, examTargetDate } from "@/lib/exam-dates";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Kompakt sınav geri sayımı — yalnız GÜN, saniye sayacı yok. Canlı
 * gün/saat/dk/sn sayacı `/sayac` sayfasındaki `<ExamCountdown/>`'da kalır;
 * burada amaç sayacı ana sayfada ve sınav sayfalarında küçük tutmak.
 *
 * SUNUCU BİLEŞENİ — tarayıcıya JS ve zamanlayıcı gitmez. Bu iki gerçeğe
 * dayanır:
 *   1. `daysBetween` (`src/lib/dates.ts`) `startOfTrtDay` üzerine kurulu, sabit
 *      +03:00 → sunucuda ve tarayıcıda aynı tamsayı.
 *   2. Pazarlama kabuğu `force-dynamic` (`src/app/(pazarlama)/layout.tsx`) →
 *      her istekte yeniden render, gün sayısı bayatlamaz.
 * `force-dynamic` bir gün kaldırılırsa bu bileşen `"use client"` + `now === null`
 * yer tutucu desenine geçmek ZORUNDA (bkz. `exam-countdown.tsx`).
 */
export function ExamCountdownStrip({
  exams,
  className,
}: {
  /** Verilirse yalnız bu sınav ailelerini gösterir (sınav açılış sayfaları). */
  exams?: readonly ("LGS" | "YKS" | "KPSS")[];
  className?: string;
}) {
  const now = new Date();
  const items = EXAM_COUNTDOWNS.filter((e) => !exams || exams.includes(e.exam))
    .map((e) => ({ ...e, days: daysBetween(now, examTargetDate(e.date)) }))
    .filter((e) => e.days >= 0)
    .sort((a, b) => a.days - b.days);

  if (items.length === 0) return null;

  return (
    <div className={cn("flex w-full flex-col items-center gap-3", className)}>
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {items.map((item) => (
          <li
            key={item.key}
            className="inline-flex items-center gap-2 rounded-full bg-card py-1.5 pr-3.5 pl-3 text-sm ring-1 ring-foreground/10"
          >
            <span
              aria-hidden
              className={cn("size-2 shrink-0 rounded-full", item.dotClass)}
            />
            <span className="font-medium">{item.title}</span>
            {item.days === 0 ? (
              <span className={cn("font-heading font-bold", item.numberClass)}>
                bugün
              </span>
            ) : (
              <>
                <span
                  className={cn(
                    "font-heading font-bold tabular-nums",
                    item.numberClass,
                  )}
                >
                  {item.days}
                </span>
                <span className="text-xs text-muted-foreground">gün</span>
              </>
            )}
            {item.estimated && (
              <span className="text-[10px] text-muted-foreground/70">
                tahmini
              </span>
            )}
          </li>
        ))}
      </ul>
      <Button variant="link" size="sm" render={<Link href="/sayac" />}>
        Tüm sınav tarihleri ve canlı sayaç
        <ArrowRightIcon data-icon="inline-end" />
      </Button>
    </div>
  );
}
