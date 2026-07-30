import Link from "next/link";
import {
  BookOpenIcon,
  CheckIcon,
  CompassIcon,
  MessageCircleIcon,
  ShieldIcon,
  SparklesIcon,
} from "lucide-react";

import { getCohort, getPublicFaqs, getPublicPackages } from "@/db/queries/cms";
import { cohortView, enrollmentOpen } from "@/lib/cohort";
import { formatKurus } from "@/lib/format";
import type {
  ExamLandingConfig,
  SupportPillar,
} from "@/lib/exam-landing-content";
import { breadcrumbSchema, courseSchema, faqPageSchema } from "@/lib/schema";
import { AiSystemSection } from "@/components/marketing/ai-system-section";
import { CohortBanner } from "@/components/marketing/cohort-banner";
import { CtaBand } from "@/components/marketing/cta-band";
import { ExamCountdownStrip } from "@/components/marketing/exam-countdown-strip";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { ProofStrip } from "@/components/marketing/proof-strip";
import { ScarcityBadge } from "@/components/marketing/scarcity-badge";
import { SectionHeading } from "@/components/brand/section-heading";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** Destek sütunu ikonları — anahtarlar `SupportPillar["key"]` ile eşleşir. */
const PILLAR_ICONS: Record<
  SupportPillar["key"],
  typeof BookOpenIcon
> = {
  akademik: BookOpenIcon,
  plan: CompassIcon,
  gorusme: MessageCircleIcon,
  dayaniklilik: ShieldIcon,
};

/**
 * Sınava özel açılış sayfası (YKS / LGS / KPSS koçluğu) — tek gövde, üç sayfa.
 * D1 (paketler, SSS, dönem) okur → sayfa `force-dynamic` bildirir.
 */
export async function ExamLanding({ config }: { config: ExamLandingConfig }) {
  const [packages, faqs, cohort] = await Promise.all([
    getPublicPackages(),
    getPublicFaqs(),
    getCohort(),
  ]);

  const cohortVm = cohortView(cohort);
  const enrollOpen = enrollmentOpen(cohort);
  const ctaHref = enrollOpen ? "/iletisim" : "/bekleme-listesi";
  const ctaLabel = enrollOpen
    ? "Ücretsiz ön görüşme"
    : "Bekleme listesine katıl";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-10 sm:px-6 md:gap-24 md:py-16">
      <JsonLd
        data={[
          courseSchema({
            exam: config.code,
            name: config.courseName,
            description: config.courseDescription,
            path: config.slug,
            withRating: true,
          }),
          faqPageSchema(faqs),
          breadcrumbSchema([
            { name: "Ana Sayfa", path: "/" },
            { name: config.breadcrumbName, path: config.slug },
          ]),
        ]}
      />

      {/* Hero */}
      <section className="relative flex flex-col items-center gap-5 text-center">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/3 h-64 w-[min(32rem,90vw)] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute top-4 right-[10%] size-32 rounded-full bg-gold/15 blur-2xl" />
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-gold" />
          {config.heroEyebrow}
        </span>
        <h1 className="font-heading text-display max-w-3xl text-balance">
          {config.heroTitleLead}
          <span className="text-primary">{config.heroTitleAccent}</span>
          <span className="text-gold">.</span>
        </h1>
        <p className="max-w-2xl text-base text-pretty text-muted-foreground md:text-lg">
          {config.heroLead}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" render={<Link href={ctaHref} />}>
            <SparklesIcon data-icon="inline-start" />
            {ctaLabel}
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/nasil-calisir" />}>
            Nasıl çalışır?
          </Button>
        </div>
        <ProofStrip className="mt-2 w-full" />
      </section>

      {/* Dönem/kontenjan */}
      <CohortBanner cohort={cohort} />

      {/* Neden / kapsam */}
      <section className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Kapsam"
          title={config.introTitle}
          description={config.introBody}
          align="center"
        />

        {/*
          Dört destek sütunu. Derinlik somutluktan gelir, sıfattan değil
          (bkz. exam-landing-content.ts başlığı) — her madde koçluk sürecinde
          gerçekten olan bir şeyi anlatır.
        */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {config.pillars.map((pillar) => {
            const Icon = PILLAR_ICONS[pillar.key];
            return (
              <div
                key={pillar.key}
                className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-heading text-base font-semibold">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-pretty text-muted-foreground">
                    {pillar.description}
                  </p>
                </div>
                <ul className="mt-1 flex flex-col gap-2">
                  {pillar.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-success" />
                      <span className="text-pretty">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/*
        AI destekli sistem — üç kart (görüşme notu, program taslağı, gizlilik).
        Başlık/gövde sınava göre değişir; kart metinleri sabittir.
      */}
      <AiSystemSection
        title={config.aiTitle}
        description={config.aiDescription}
        items={["gorusme", "program", "gizlilik"]}
      />

      {/* Paket teaser */}
      <section className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Paketler"
          title="Sade ve şeffaf fiyatlandırma"
          description="Uzun taahhüt yok; her paket ücretsiz ön görüşmeyle başlar."
          align="center"
        />
        <div className="grid gap-4 md:grid-cols-3">
          {packages.slice(0, 3).map((pkg, i) => (
            <div
              key={pkg.name}
              className={
                i === 1
                  ? "flex flex-col gap-3 rounded-2xl bg-card p-6 ring-2 ring-primary/40"
                  : "flex flex-col gap-3 rounded-2xl bg-card p-6 ring-1 ring-foreground/10"
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-heading text-base font-semibold">
                  {pkg.name}
                </span>
                {i === 1 && <Badge>En popüler</Badge>}
              </div>
              {i === 1 &&
                cohortVm.visible &&
                !cohortVm.isFull &&
                cohortVm.remaining != null && (
                  <ScarcityBadge remaining={cohortVm.remaining} className="w-fit" />
                )}
              <div className="flex items-baseline gap-1.5">
                <span className="font-heading text-2xl font-bold tabular-nums">
                  {formatKurus(pkg.priceKurus)}
                </span>
                {pkg.period && (
                  <span className="text-sm text-muted-foreground">
                    / {pkg.period}
                  </span>
                )}
              </div>
              <ul className="flex flex-col gap-1.5">
                {pkg.features.slice(0, 3).map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Button variant="outline" className="self-center" render={<Link href="/fiyatlar" />}>
          Tüm paket detayları
        </Button>
      </section>

      {/* Sayaç — kompakt şerit, yalnız bu sınav ailesi. */}
      <section
        aria-label="Sınav geri sayımı"
        className="flex flex-col items-center gap-3"
      >
        <span className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Sınava kalan
        </span>
        <ExamCountdownStrip exams={[config.code]} />
      </section>

      {/* SSS */}
      <section className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Merak edilenler"
          title="Sıkça sorulan sorular"
          description="Süreç, görüşmeler ve ödeme hakkında en çok sorulanlar."
          align="center"
        />
        <div className="mx-auto w-full max-w-3xl">
          <FaqAccordion items={faqs} />
        </div>
      </section>

      <CtaBand
        title={`${config.breadcrumbName} için ilk adımı at.`}
        description="Ücretsiz ön görüşmede hedefini anlat; sana özel yol haritanı dinle. Karar tamamen senin."
      />
    </div>
  );
}
