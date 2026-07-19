import Link from "next/link";
import { CheckIcon, InfoIcon, SparklesIcon } from "lucide-react";

import { getCohort, getPublicFaqs, getPublicPackages } from "@/db/queries/cms";
import { cohortView, enrollmentOpen } from "@/lib/cohort";
import { formatKurus } from "@/lib/format";
import { CohortBanner } from "@/components/marketing/cohort-banner";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { ScarcityBadge } from "@/components/marketing/scarcity-badge";
import { SectionHeading } from "@/components/brand/section-heading";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbSchema, faqPageSchema, serviceSchema } from "@/lib/schema";

// Paketler D1'den okunur → istek başına render.
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Fiyatlar",
  description:
    "Derecenin Ruhu koçluk paketleri: aylık koçluk, 3 aylık paket ve deneme analizi paketi. Uzun taahhüt yok; her paket ücretsiz ön görüşmeyle başlar.",
  path: "/fiyatlar",
});

export default async function FiyatlarPage() {
  const [packages, faqs, cohort] = await Promise.all([
    getPublicPackages(),
    getPublicFaqs(),
    getCohort(),
  ]);

  const cohortVm = cohortView(cohort);
  const enrollOpen = enrollmentOpen(cohort);
  // Kayıtlar kapalıysa paket CTA'ları bekleme listesine döner.
  const ctaHref = enrollOpen ? "/iletisim" : "/bekleme-listesi";
  const ctaLabel = enrollOpen
    ? "Ücretsiz ön görüşmeyle başla"
    : "Bekleme listesine katıl";

  // Ödeme/başlama ile ilgili SSS'leri öne al.
  const paymentFaqs = faqs.filter(
    (f) =>
      f.question.includes("Ödeme") ||
      f.question.includes("ön görüşme") ||
      f.question.includes("başlamak"),
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-10 sm:px-6 md:gap-20 md:py-16">
      {/* Yapısal veri: paketli koçluk hizmeti (Offer'lar) + ödeme SSS'leri.
          Puan burada gösterilmediği için aggregateRating EKLENMEZ (politika). */}
      <JsonLd
        data={[
          serviceSchema({ name: "Sınav Koçluğu Paketleri", packages }),
          ...(paymentFaqs.length ? [faqPageSchema(paymentFaqs)] : []),
          breadcrumbSchema([
            { name: "Ana Sayfa", path: "/" },
            { name: "Fiyatlar", path: "/fiyatlar" },
          ]),
        ]}
      />
      <section className="relative flex flex-col items-center gap-4 text-center">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 h-64 w-[min(32rem,90vw)] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-gold" />
          Fiyatlandırma
        </span>
        <h1 className="font-heading text-headline max-w-2xl text-balance">
          Sade paketler, <span className="text-primary">sınırlı kontenjan</span>
          <span className="text-gold">.</span>
        </h1>
        <p className="max-w-xl text-base text-pretty text-muted-foreground">
          Her paket ücretsiz ön görüşmeyle başlar; kayıt kararını görüşmeden
          sonra verirsin. Kaliteyi korumak için her dönemde sınırlı sayıda
          öğrenciyle çalışırız. Ödeme havale/EFT veya nakit yapılır.
        </p>
      </section>

      {/* Dönem/kontenjan bandı */}
      <CohortBanner cohort={cohort} />

      {/* Paket kartları */}
      <section className="grid gap-4 lg:grid-cols-3">
        {packages.map((pkg, i) => {
          const highlighted = i === 1;
          return (
            <div
              key={pkg.name}
              className={cn(
                "relative flex flex-col gap-5 rounded-3xl bg-card p-6 sm:p-7",
                highlighted
                  ? "ring-2 ring-primary/50 shadow-xl shadow-primary/10"
                  : "ring-1 ring-foreground/10",
              )}
            >
              {highlighted && (
                <Badge className="absolute -top-2.5 left-6">En popüler</Badge>
              )}
              <div className="flex flex-col gap-1">
                <h2 className="font-heading text-lg font-semibold">{pkg.name}</h2>
                {highlighted &&
                  cohortVm.visible &&
                  !cohortVm.isFull &&
                  cohortVm.remaining != null && (
                    <ScarcityBadge
                      remaining={cohortVm.remaining}
                      className="w-fit"
                    />
                  )}
                {pkg.compareAtKurus && pkg.compareAtKurus > pkg.priceKurus && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground tabular-nums line-through">
                      {formatKurus(pkg.compareAtKurus)}
                    </span>
                    <Badge className="bg-success/15 text-success">
                      %
                      {Math.round(
                        (1 - pkg.priceKurus / pkg.compareAtKurus) * 100,
                      )}{" "}
                      indirim
                    </Badge>
                  </div>
                )}
                <div className="flex items-baseline gap-1.5">
                  <span className="font-heading text-3xl font-bold tabular-nums">
                    {formatKurus(pkg.priceKurus)}
                  </span>
                  {pkg.period && (
                    <span className="text-sm text-muted-foreground">
                      / {pkg.period}
                    </span>
                  )}
                </div>
              </div>
              <ul className="flex flex-1 flex-col gap-2.5">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-success" />
                    <span className="text-pretty">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                variant={highlighted ? "default" : "outline"}
                className="w-full"
                render={<Link href={ctaHref} />}
              >
                <SparklesIcon data-icon="inline-start" />
                {ctaLabel}
              </Button>
            </div>
          );
        })}
      </section>

      <div className="mx-auto flex max-w-2xl items-start gap-3 rounded-xl bg-info/10 p-4 text-sm text-pretty">
        <InfoIcon className="mt-0.5 size-4 shrink-0 text-info" />
        <p className="text-muted-foreground">
          Online ödeme alınmaz — kayıt ve ödeme, ücretsiz ön görüşmede
          netleştikten sonra koçunla birlikte planlanır. Kardeş ve grup
          indirimleri için görüşmede sorabilirsin.
        </p>
      </div>

      {/* İlgili SSS */}
      {paymentFaqs.length > 0 && (
        <section className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading
            eyebrow="Merak edilenler"
            title="Ödeme ve başlangıç"
          />
          <FaqAccordion items={paymentFaqs} />
        </section>
      )}

      <CtaBand
        title="Hangi paket sana uygun, birlikte karar verelim."
        description="Ön görüşmede hedefine ve temposuna göre en mantıklı paketi öneririz — satış baskısı yok, kontenjan sınırlı."
      />
    </div>
  );
}
