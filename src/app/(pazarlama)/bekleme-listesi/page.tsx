import Link from "next/link";
import { ClockIcon, ShieldCheckIcon, StarIcon } from "lucide-react";

import { getCohort } from "@/db/queries/cms";
import { coachStats, ratingLabel } from "@/db/seed/cms-content";
import { cohortView } from "@/lib/cohort";
import { WaitlistForm } from "@/components/marketing/waitlist-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildMetadata } from "@/lib/seo";

// Dönem durumu D1'den okunur → istek başına render.
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Bekleme Listesi",
  description:
    "Derecenin Ruhu birebir koçlukta her dönem sınırlı kontenjanla çalışır. Kontenjan açıldığında ilk haber alanlardan olmak için bekleme listesine katıl.",
  path: "/bekleme-listesi",
});

export default async function BeklemeListesiPage() {
  const cohort = await getCohort();
  const v = cohortView(cohort);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-10 sm:px-6 md:py-16">
      <section className="relative flex flex-col items-center gap-4 text-center">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/3 h-64 w-[min(30rem,90vw)] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute top-4 right-[10%] size-32 rounded-full bg-gold/15 blur-2xl" />
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-gold" />
          {v.label} · Sınırlı kontenjan
        </span>
        <h1 className="font-heading text-headline max-w-2xl text-balance">
          Sıradaki dönemde <span className="text-primary">yerini ayır</span>
          <span className="text-gold">.</span>
        </h1>
        <p className="max-w-xl text-base text-pretty text-muted-foreground">
          Derece kalitesini korumak için birebir koçlukta her dönem sınırlı
          sayıda öğrenciyle çalışıyoruz.
          {v.isFull
            ? " Bu dönemin kontenjanı doldu — bekleme listesine katıl, kontenjan açıldığında ilk sana haber verelim."
            : " Yerini şimdiden ayırmak istersen bekleme listemize katılabilirsin; öncelik sırasıyla ilerliyoruz."}
        </p>
      </section>

      <div className="flex flex-col gap-4 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <StarIcon className="size-4 fill-gold text-gold" />
          {ratingLabel} yıldız · {coachStats.reviewCount} yorum — Gigbi&apos;de
          doğrulanabilir
        </span>
        <span className="inline-flex items-center gap-2">
          <ClockIcon className="size-4" />
          Kontenjan açıldığında öncelik bekleme listesindekilere verilir
        </span>
        <span className="inline-flex items-center gap-2">
          <ShieldCheckIcon className="size-4" />
          Bilgilerin yalnızca kontenjan bilgilendirmesi için kullanılır
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {v.waitlistOpen
              ? "Bekleme listesine katıl"
              : "Bekleme listesi şu an kapalı"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {v.waitlistOpen ? (
            <WaitlistForm />
          ) : (
            <div className="flex flex-col items-start gap-4 py-4">
              <p className="text-sm text-pretty text-muted-foreground">
                Şu an yeni bekleme kaydı almıyoruz. Bir sonraki dönem
                açıldığında haberdar olmak için ücretsiz ön görüşme talebi
                bırakabilirsin.
              </p>
              <Button render={<Link href="/iletisim" />}>
                Ön görüşme talebi bırak
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
