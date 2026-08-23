import Link from "next/link";
import { CheckIcon, InfoIcon, MinusIcon, SparklesIcon } from "lucide-react";

import {
  getCohort,
  getPublicFaqs,
  getPublicPackages,
  type PublicPackage,
} from "@/db/queries/cms";
import { cohortView, enrollmentOpen } from "@/lib/cohort";
import { COACHING_EXCLUDES, COACHING_INCLUDES } from "@/lib/coaching-includes";
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

  // Üç ayrı ürün hattı, üç ayrı bölüm (bkz. PackageGrid).
  const koclukPackages = packages.filter((p) => p.kind === "kocluk");
  const ozelDersPackages = packages.filter((p) => p.kind === "ozel_ders");
  const birlikatePackages = packages.filter(
    (p) => p.kind === "kocluk_ozel_ders",
  );

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
          serviceSchema({
            name: "Sınav Koçluğu Paketleri",
            packages: koclukPackages,
          }),
          ...(ozelDersPackages.length
            ? [
                serviceSchema({
                  name: "Özel Ders Paketleri",
                  serviceType: "Birebir özel ders (LGS, YKS, KPSS)",
                  packages: ozelDersPackages,
                }),
              ]
            : []),
          ...(birlikatePackages.length
            ? [
                serviceSchema({
                  name: "Koçluk + Özel Ders Paketleri",
                  serviceType: "Sınav koçluğu ve birebir özel ders",
                  packages: birlikatePackages,
                }),
              ]
            : []),
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

      {/* Üç hizmet hattı, üç bölüm — hepsi aynı başlık kalıbında. */}
      {koclukPackages.length > 0 && (
        <section className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Çekirdek hizmet"
            title="Koçluk paketleri"
            description="Haftalık program, birebir görüşme ve günlük takip. Süreyi sen seçersin: uzadıkça aylık maliyet düşer."
          />
          <PackageGrid
            packages={koclukPackages}
            cohortVm={cohortVm}
            ctaHref={ctaHref}
            ctaLabel={ctaLabel}
          />
        </section>
      )}

      {ozelDersPackages.length > 0 && (
        <section className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Ek hizmet"
            title="Özel ders paketleri"
            description="Koçluk bir sistemdir, ders anlatımı değildir. Konu eksiğini kapatmak için ders almak istersen özel ders ayrı bir hizmet olarak alınır — saatler uygulamada takip edilir, kalan hakkını her an görürsün."
          />
          <PackageGrid
            packages={ozelDersPackages}
            cohortVm={cohortVm}
            ctaHref={ctaHref}
            ctaLabel={ctaLabel}
          />
        </section>
      )}

      {birlikatePackages.length > 0 && (
        <section className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Birlikte"
            title="Koçluk + Özel ders"
            description="İkisini birlikte alırsan program ve ders tek planda buluşur: koçun eksiği tespit eder, ders o eksiği kapatır. Ayrı ayrı almaya göre daha uygundur."
          />
          <PackageGrid
            packages={birlikatePackages}
            cohortVm={cohortVm}
            ctaHref={ctaHref}
            ctaLabel={ctaLabel}
          />
        </section>
      )}

      <div className="mx-auto flex max-w-2xl items-start gap-3 rounded-xl bg-info/10 p-4 text-sm text-pretty">
        <InfoIcon className="mt-0.5 size-4 shrink-0 text-info" />
        <p className="text-muted-foreground">
          Online ödeme alınmaz — kayıt ve ödeme, ücretsiz ön görüşmede
          netleştikten sonra koçunla birlikte planlanır. Kardeş ve grup
          indirimleri için görüşmede sorabilirsin.
        </p>
      </div>

      {/*
        "Pakete tam olarak ne dahil?" envanteri. Geri bildirim (Görsel 13)
        rakiplerin daha detaylı anlattığını söylüyordu; cevabımız abartı değil,
        kalem kalem kapsam + neyin DAHİL OLMADIĞI.
      */}
      <section className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Kapsam"
          title="Her pakette olanlar"
          description="Paketler süre ve görüşme sıklığıyla ayrışır; aşağıdakiler hepsinde vardır."
          align="center"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COACHING_INCLUDES.map((group) => (
            <div
              key={group.title}
              className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10"
            >
              <h3 className="font-heading text-sm font-semibold tracking-wide uppercase">
                {group.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-success" />
                    <span className="text-pretty">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Beklenti yönetimi — ne olmadığını söylemek güveni artırır. */}
        <div className="mx-auto flex max-w-2xl flex-col gap-2 rounded-2xl bg-muted/50 p-5">
          <span className="text-sm font-semibold">Dahil olmayanlar</span>
          <ul className="flex flex-col gap-1.5">
            {COACHING_EXCLUDES.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <MinusIcon className="mt-0.5 size-3.5 shrink-0" />
                <span className="text-pretty">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* İlgili SSS */}
      {paymentFaqs.length > 0 && (
        <section className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="Merak edilenler"
            title="Ödeme ve başlangıç"
            align="center"
          />
          <div className="mx-auto w-full max-w-3xl">
            <FaqAccordion items={paymentFaqs} />
          </div>
        </section>
      )}

      <CtaBand
        title="Hangi paket sana uygun, birlikte karar verelim."
        description="Ön görüşmede hedefine ve temposuna göre en mantıklı paketi öneririz — satış baskısı yok, kontenjan sınırlı."
      />
    </div>
  );
}

/**
 * Bir hizmet türünün kart ızgarası. Koçluk ve özel ders AYRI bölümlerde
 * gösterilir: ikisi farklı ürün, yan yana dizilince "hangisi hangisinin yerine
 * geçiyor" karışıyor. "En popüler" rozeti bölüm İÇİNDE görecelidir — eskiden
 * global ikinci karta sabitliydi, bölünme sonrası yanlış karta düşerdi.
 */
function PackageGrid({
  packages,
  cohortVm,
  ctaHref,
  ctaLabel,
}: {
  packages: PublicPackage[];
  cohortVm: ReturnType<typeof cohortView>;
  ctaHref: string;
  ctaLabel: string;
}) {
  if (packages.length === 0) return null;
  // Tek kart varsa vurgulamak anlamsız; 2+ kartta ikincisi öne çıkar.
  const highlightIndex = packages.length > 1 ? 1 : -1;

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {packages.map((pkg, i) => {
        const highlighted = i === highlightIndex;
        const discounted =
          pkg.compareAtKurus != null && pkg.compareAtKurus > pkg.priceKurus;
        return (
          <div
            key={pkg.name}
            className={cn(
              "relative flex flex-col gap-5 rounded-3xl bg-card p-6 sm:p-7",
              highlighted
                ? "shadow-xl ring-2 shadow-primary/10 ring-primary/50"
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
              {discounted && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground line-through tabular-nums">
                    {formatKurus(pkg.compareAtKurus!)}
                  </span>
                  <Badge className="bg-success/15 text-success">
                    %
                    {Math.round(
                      (1 - pkg.priceKurus / pkg.compareAtKurus!) * 100,
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
              {pkg.lessonHours ? (
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground tabular-nums">
                    {pkg.lessonHours} saat
                  </strong>{" "}
                  özel ders dahil
                </p>
              ) : null}
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
  );
}
