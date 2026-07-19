import Link from "next/link";
import { ArrowRightIcon, SparklesIcon } from "lucide-react";

import type { CohortSettings } from "@/db/schema";
import { cohortView } from "@/lib/cohort";
import { Button } from "@/components/ui/button";
import { CohortCountdown } from "@/components/marketing/cohort-countdown";

/**
 * Dönem/kontenjan bandı — no-cap framing (B): "Sınırlı kontenjan" +
 * kayıt kapanış geri sayımı. Dönem dolduğunda bekleme listesine yönlendirir.
 * `scarcityVisible` kapalıysa hiç render olmaz. Ton sakin/premium — genuine FOMO.
 */
export function CohortBanner({ cohort }: { cohort: CohortSettings }) {
  const v = cohortView(cohort);
  if (!v.visible) return null;

  const closesMs = !v.isFull && v.closesOn ? v.closesOn.getTime() : null;

  return (
    <section
      aria-label="Dönem bilgisi"
      className="relative overflow-hidden rounded-3xl bg-primary/5 px-6 py-7 ring-1 ring-primary/15 sm:px-8"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-16 right-8 size-40 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-20 left-10 size-48 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            <span aria-hidden className="size-1.5 rounded-full bg-gold" />
            {v.label} · {v.isFull ? "Kontenjan doldu" : "Sınırlı kontenjan"}
          </span>

          {v.isFull ? (
            <>
              <h2 className="font-heading text-title text-balance">
                Bu dönemin kontenjanı doldu.
              </h2>
              <p className="max-w-xl text-sm text-pretty text-muted-foreground">
                Kaliteyi korumak için her dönemde sınırlı sayıda öğrenciyle
                çalışıyoruz. Bir sonraki dönem için bekleme listesine katıl;
                kontenjan açıldığında <strong>ilk sana</strong>{" "}
                haber verelim.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-heading text-title text-balance">
                Her dönemde sınırlı sayıda öğrenci alıyoruz.
              </h2>
              <p className="max-w-xl text-sm text-pretty text-muted-foreground">
                Derece kalitesini korumak için birebir koçlukta kontenjanı
                bilinçli tutuyoruz.
                {closesMs !== null && (
                  <>
                    {" "}
                    Bu dönemin kayıtları{" "}
                    <CohortCountdown
                      closesOnMs={closesMs}
                      className="font-medium text-foreground"
                    />
                    .
                  </>
                )}
              </p>
            </>
          )}
        </div>

        <div className="shrink-0">
          {v.isFull ? (
            v.waitlistOpen && (
              <Button size="lg" render={<Link href="/bekleme-listesi" />}>
                Bekleme listesine katıl
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            )
          ) : (
            <Button size="lg" render={<Link href="/iletisim" />}>
              <SparklesIcon data-icon="inline-start" />
              Ücretsiz ön görüşme
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
